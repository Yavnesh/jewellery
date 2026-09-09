import {
  LogisticsAdapter,
  LogisticsProvider,
  ShipmentInput,
  ShipmentResult,
  ShippingRateOption,
  TrackingResult,
} from "../domain/logistics.types";

export class BlueDartSecuredAdapter implements LogisticsAdapter {
  public readonly provider = LogisticsProvider.BLUEDART;

  async getRates(input: ShipmentInput): Promise<ShippingRateOption[]> {
    return [
      {
        provider: LogisticsProvider.BLUEDART,
        carrierName: "BlueDart Apex Secured",
        serviceCode: "BLUEDART_ARMORED_VALUABLE",
        serviceName: "Apex Armored High-Value Transit",
        estimatedDeliveryDays: "1–2 days",
        rate: 1250,
        currency: "INR",
      },
      {
        provider: LogisticsProvider.BLUEDART,
        carrierName: "BlueDart Apex Secured",
        serviceCode: "BLUEDART_DOMESTIC_PRIORITY",
        serviceName: "Domestic Priority Air (Insured)",
        estimatedDeliveryDays: "2–3 days",
        rate: 850,
        currency: "INR",
      },
    ];
  }

  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    const timestamp = Date.now().toString().slice(-7);
    const awbCode = `BD${timestamp}`;
    const shipmentId = `bd_shp_${Date.now()}`;

    const eta = new Date();
    eta.setDate(eta.getDate() + 2);

    return {
      success: true,
      provider: this.provider,
      carrierName: "BlueDart Apex Secured",
      serviceName: input.service || "Apex Armored High-Value Transit",
      shipmentId,
      awbCode,
      labelUrl: `/api/admin/shipments/label?carrier=BLUEDART&awb=${awbCode}`,
      estimatedDelivery: eta.toISOString(),
      estimatedDeliveryFrom: eta.toISOString(),
      estimatedDeliveryTo: new Date(eta.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async trackShipment(awbCode: string): Promise<TrackingResult> {
    const now = new Date();
    return {
      awbCode,
      provider: this.provider,
      status: "OUT_FOR_DELIVERY",
      carrierRawStatus: "OUT_FOR_DELIVERY_VAULT_COURIER",
      estimatedDelivery: now.toISOString(),
      activity: [
        {
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          status: "OUT_FOR_DELIVERY",
          carrierStatus: "WITH_COURIER",
          location: "Bandra West Delivery Hub, Mumbai",
          description: "Assigned to dedicated armed courier for white-glove handoff (OTP Required)",
        },
        {
          date: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
          status: "IN_TRANSIT",
          carrierStatus: "ARRIVED_DESTINATION_VAULT",
          location: "Mumbai Secured Airport Vault",
          description: "Arrived at destination secured vault facility",
        },
        {
          date: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
          status: "PICKED_UP",
          carrierStatus: "ARMORED_PICKUP_COMPLETE",
          location: "Jaipur Central Vault",
          description: "Package collected under dual-key tamper seal",
        },
      ],
    };
  }

  async cancelShipment(shipmentId: string, awbCode: string) {
    return { success: true, message: `BlueDart shipment ${awbCode} cancelled.` };
  }
}
