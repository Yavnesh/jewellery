import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { ShippingService } from "@/src/modules/logistics/application/shipping.service";
import { LogisticsProvider } from "@/src/modules/logistics/domain/logistics.types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const shipments = await prisma.orderShipment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      include: {
        events: {
          orderBy: { eventAt: "desc" },
        },
        items: {
          include: {
            orderProduct: {
              include: {
                product: { select: { title: true, mainImage: true, price: true } },
                variant: { select: { sku: true, title: true } },
              },
            },
          },
        },
      },
    });

    const shippingService = ShippingService.getInstance();
    const enrichedShipments = shipments.map((s) => ({
      ...s,
      humanStatus: shippingService.getHumanStatusDescription(s.status),
    }));

    return NextResponse.json({
      shipments: enrichedShipments,
    });
  } catch (error: any) {
    console.error("Fetch shipments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load order shipments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.customer_order.findUnique({
      where: { id },
      include: { products: true, addressSnapshot: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const {
      provider = "BLUEDART",
      carrier = "BlueDart Apex",
      service = "Apex Armored High-Value Transit",
      trackingNumber: customTracking,
      weight = 0.5,
      length = 15,
      width = 12,
      height = 8,
      packageCount = 1,
      insuranceValue = order.total || 0,
      signatureReq = true,
      items = [], // [{ orderProductId, quantity }]
      customsInfo,
      internalNotes,
    } = body;

    const shippingService = ShippingService.getInstance();
    const adapter = shippingService.getAdapter(provider);

    let generatedTracking = customTracking;
    let labelUrl: string | undefined;
    let etaDate: Date | undefined;
    let providerShipmentId: string | undefined;

    if (!generatedTracking) {
      // Call provider adapter
      const shipmentResult = await adapter.createShipment({
        orderId: order.id,
        provider,
        carrierName: carrier,
        service,
        customerName: `${order.name} ${order.lastname}`.trim(),
        company: order.company || undefined,
        phone: order.phone,
        email: order.email,
        address: order.adress,
        addressLine2: order.apartment || undefined,
        city: order.city,
        state: order.addressSnapshot?.state || "State",
        postalCode: order.postalCode,
        country: order.country,
        weightKg: Number(weight) || 0.5,
        lengthCm: Number(length) || 15,
        widthCm: Number(width) || 12,
        heightCm: Number(height) || 8,
        packageCount: Number(packageCount) || 1,
        subtotal: order.total,
        items,
        customs: customsInfo,
        insuranceValue: Number(insuranceValue) || order.total,
        signatureRequired: signatureReq,
      });

      if (!shipmentResult.success && !customTracking) {
        return NextResponse.json(
          { error: shipmentResult.error || "Carrier failed to create shipment" },
          { status: 400 }
        );
      }

      generatedTracking = shipmentResult.awbCode || `AWB${Date.now()}`;
      labelUrl = shipmentResult.labelUrl;
      providerShipmentId = shipmentResult.shipmentId;
      if (shipmentResult.estimatedDelivery) {
        etaDate = new Date(shipmentResult.estimatedDelivery);
      }
    }

    if (!etaDate) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      etaDate = d;
    }

    // Determine initial status
    const initialStatus = "LABEL_CREATED";

    // Create DB OrderShipment record with items & initial event
    const newShipment = await prisma.orderShipment.create({
      data: {
        orderId: id,
        provider: provider.toUpperCase(),
        providerShipmentId,
        courier: carrier,
        service,
        trackingNumber: generatedTracking,
        status: initialStatus,
        previousStatus: "NOT_SHIPPED",
        estimatedDeliveryAt: etaDate,
        shippedAt: new Date(),
        weight: Number(weight) || 0.5,
        length: Number(length) || 15,
        width: Number(width) || 12,
        height: Number(height) || 8,
        packageCount: Number(packageCount) || 1,
        insuranceValue: Number(insuranceValue) || order.total,
        signatureReq: Boolean(signatureReq),
        labelUrl,
        customsInfo: customsInfo || null,
        internalNotes: internalNotes || null,
        events: {
          create: {
            status: initialStatus,
            carrierStatus: "MANIFEST_CREATED",
            description: `Shipment created via ${carrier} (${service || "Standard"})`,
            location: order.city || "Origin Facility",
            source: "ADMIN",
          },
        },
        items: {
          create: items.map((itm: any) => ({
            orderProductId: itm.orderProductId,
            quantity: Number(itm.quantity) || 1,
          })),
        },
      },
      include: {
        events: true,
        items: {
          include: {
            orderProduct: {
              include: { product: true },
            },
          },
        },
      },
    });

    // Compute whether order is fully shipped or partially shipped
    const allShipments = await prisma.orderShipment.findMany({
      where: { orderId: id },
      include: { items: true },
    });

    const totalOrderedQty = order.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalShippedQty = allShipments.reduce(
      (sum, shp) => sum + shp.items.reduce((s, itm) => s + itm.quantity, 0),
      0
    );

    let newOrderStatus = order.status;
    if (totalShippedQty >= totalOrderedQty) {
      newOrderStatus = "SHIPPED";
    } else if (totalShippedQty > 0) {
      newOrderStatus = "PARTIALLY_SHIPPED";
    }

    await prisma.customer_order.update({
      where: { id },
      data: { status: newOrderStatus },
    });

    // Record Immutable Audit Log
    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "CREATE_SHIPMENT",
      entityType: "SHIPMENT",
      entityId: newShipment.id,
      newValue: {
        orderId: id,
        trackingNumber: generatedTracking,
        carrier,
        status: initialStatus,
        itemsCount: items.length,
      },
    });

    return NextResponse.json({
      success: true,
      shipment: newShipment,
      orderStatus: newOrderStatus,
    });
  } catch (error: any) {
    console.error("Create shipment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create shipment" },
      { status: 500 }
    );
  }
}
