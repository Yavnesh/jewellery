import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { ShippingService } from "@/src/modules/logistics/application/shipping.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const providerUpper = (provider || "CARRIER").toUpperCase();
    const payload = await request.json();

    // Extract common webhook fields or parse per provider
    const externalEventId =
      payload.event_id ||
      payload.eventId ||
      payload.id ||
      `${providerUpper}_${payload.tracking_number || payload.awb || payload.shipment_id}_${payload.current_status || payload.status}_${Date.now()}`;

    const trackingNumber =
      payload.tracking_number ||
      payload.trackingNumber ||
      payload.awb ||
      payload.awb_code ||
      payload.awbNumber;

    const rawStatus =
      payload.current_status ||
      payload.status ||
      payload.event_type ||
      payload.shipment_status ||
      "IN_TRANSIT";

    const location = payload.location || payload.city || payload.facility || "Carrier Hub";
    const description =
      payload.description ||
      payload.activity ||
      payload.message ||
      `Carrier update received: ${rawStatus}`;

    if (!trackingNumber) {
      return NextResponse.json({ error: "Missing tracking number in webhook payload" }, { status: 400 });
    }

    // Webhook Idempotency check
    const existingEvent = await prisma.shipmentTrackingEvent.findFirst({
      where: { externalEventId },
    });

    if (existingEvent) {
      return NextResponse.json({ message: "Duplicate webhook event acknowledged (Idempotent)", status: "ALREADY_PROCESSED" });
    }

    // Locate shipment in database
    const shipment = await prisma.orderShipment.findFirst({
      where: { trackingNumber },
      include: { order: true },
    });

    if (!shipment) {
      // Record incoming webhook for troubleshooting even if shipment not found
      await prisma.incomingWebhookEvent.create({
        data: {
          provider: providerUpper,
          payload: JSON.stringify(payload),
          status: "FAILED",
        },
      });
      return NextResponse.json({ error: "Shipment not found for tracking number" }, { status: 404 });
    }

    // Normalize Status via ShippingService
    const shippingService = ShippingService.getInstance();
    const normalizedStatus = shippingService.normalizeStatus(rawStatus, providerUpper);

    // Update Shipment record
    const updateData: any = {
      status: normalizedStatus,
      previousStatus: shipment.status,
    };

    if (normalizedStatus === "DELIVERED" && !shipment.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (normalizedStatus === "PICKED_UP" && !shipment.pickedUpAt) {
      updateData.pickedUpAt = new Date();
    }
    if (payload.estimated_delivery) {
      updateData.estimatedDeliveryAt = new Date(payload.estimated_delivery);
    }

    const updatedShipment = await prisma.orderShipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    // Create Tracking Event
    await prisma.shipmentTrackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: normalizedStatus,
        carrierStatus: rawStatus,
        description,
        location,
        source: "CARRIER",
        externalEventId,
        rawPayload: payload,
      },
    });

    // If shipment is DELIVERED, check if all shipments for order are delivered
    if (normalizedStatus === "DELIVERED") {
      const orderShipments = await prisma.orderShipment.findMany({
        where: { orderId: shipment.orderId },
      });
      const allDelivered = orderShipments.every((s) => s.id === shipment.id || s.status === "DELIVERED");
      if (allDelivered) {
        await prisma.customer_order.update({
          where: { id: shipment.orderId },
          data: { status: "delivered" },
        });
      }
    }

    // Log processed webhook
    await prisma.incomingWebhookEvent.create({
      data: {
        provider: providerUpper,
        payload: JSON.stringify(payload),
        status: "PROCESSED",
      },
    });

    return NextResponse.json({
      success: true,
      shipmentId: shipment.id,
      status: normalizedStatus,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process shipping webhook" }, { status: 500 });
  }
}
