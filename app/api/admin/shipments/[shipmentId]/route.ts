import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { ShippingService } from "@/src/modules/logistics/application/shipping.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { shipmentId } = await params;
    const shipment = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: { id: true, name: true, lastname: true, email: true, phone: true, city: true, country: true },
        },
        events: { orderBy: { eventAt: "desc" } },
        items: {
          include: {
            orderProduct: {
              include: { product: true, variant: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const shippingService = ShippingService.getInstance();

    return NextResponse.json({
      shipment: {
        ...shipment,
        humanStatus: shippingService.getHumanStatusDescription(shipment.status),
      },
    });
  } catch (error: any) {
    console.error("Get shipment error:", error);
    return NextResponse.json({ error: error.message || "Failed to load shipment" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { shipmentId } = await params;
    const body = await request.json();
    const {
      status,
      carrier,
      trackingNumber,
      estimatedDeliveryAt,
      internalNotes,
      newEvent, // { status, description, location, carrierStatus }
    } = body;

    const existingShipment = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!existingShipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status && status !== existingShipment.status) {
      updateData.previousStatus = existingShipment.status;
      updateData.status = status;
      if (status === "DELIVERED") updateData.deliveredAt = new Date();
      if (status === "PICKED_UP") updateData.pickedUpAt = new Date();
    }
    if (carrier) updateData.courier = carrier;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDeliveryAt) updateData.estimatedDeliveryAt = new Date(estimatedDeliveryAt);
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const updatedShipment = await prisma.orderShipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    // If new manual tracking event was submitted
    if (newEvent && newEvent.description) {
      await prisma.shipmentTrackingEvent.create({
        data: {
          shipmentId,
          status: newEvent.status || status || existingShipment.status,
          carrierStatus: newEvent.carrierStatus || "MANUAL_ENTRY",
          description: newEvent.description,
          location: newEvent.location || "Admin Operations",
          source: "ADMIN",
        },
      });
    }

    // Check if order fulfillment status needs update if delivered
    if (status === "DELIVERED") {
      const orderShipments = await prisma.orderShipment.findMany({
        where: { orderId: existingShipment.orderId },
      });
      const allDelivered = orderShipments.every((s) => s.id === shipmentId || s.status === "DELIVERED");
      if (allDelivered) {
        await prisma.customer_order.update({
          where: { id: existingShipment.orderId },
          data: { status: "delivered" },
        });
      }
    }

    // Record Audit Log
    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "UPDATE_SHIPMENT_MANUAL",
      entityType: "SHIPMENT",
      entityId: shipmentId,
      oldValue: existingShipment,
      newValue: { ...updatedShipment, newEvent },
    });

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
    });
  } catch (error: any) {
    console.error("Update shipment error:", error);
    return NextResponse.json({ error: error.message || "Failed to update shipment" }, { status: 500 });
  }
}
