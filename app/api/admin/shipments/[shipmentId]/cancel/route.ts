import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { ShippingService } from "@/src/modules/logistics/application/shipping.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { shipmentId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Cancelled by administrator";

    const shipment = await prisma.orderShipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const shippingService = ShippingService.getInstance();
    const adapter = shippingService.getAdapter(shipment.provider);
    if (adapter.cancelShipment && shipment.providerShipmentId) {
      await adapter.cancelShipment(shipment.providerShipmentId, shipment.trackingNumber);
    }

    const updated = await prisma.orderShipment.update({
      where: { id: shipmentId },
      data: {
        status: "CANCELLED",
        previousStatus: shipment.status,
        internalNotes: shipment.internalNotes
          ? `${shipment.internalNotes}\n[Cancellation]: ${reason}`
          : `[Cancellation]: ${reason}`,
        events: {
          create: {
            status: "CANCELLED",
            carrierStatus: "VOIDED",
            description: `Shipment cancelled: ${reason}`,
            location: "Admin Portal",
            source: "ADMIN",
          },
        },
      },
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "CANCEL_SHIPMENT",
      entityType: "SHIPMENT",
      entityId: shipmentId,
      oldValue: shipment,
      newValue: updated,
    });

    return NextResponse.json({ success: true, shipment: updated });
  } catch (error: any) {
    console.error("Cancel shipment error:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel shipment" }, { status: 500 });
  }
}
