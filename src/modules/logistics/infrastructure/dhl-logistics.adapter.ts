import {
  LogisticsAdapter,
  LogisticsProvider,
  ShipmentInput,
  ShipmentResult,
  ShippingRateOption,
  TrackingResult,
  NormalizedShipmentStatus,
} from "../domain/logistics.types";

export class DHLAdapter implements LogisticsAdapter {
  public readonly provider = LogisticsProvider.DHL;

  async getRates(input: ShipmentInput): Promise<ShippingRateOption[]> {
    const isInternational = input.country.toUpperCase() !== "IN" && input.country.toUpperCase() !== "INDIA";
    return [
      {
        provider: LogisticsProvider.DHL,
        carrierName: "DHL Express",
        serviceCode: "DHL_EXPRESS_WORLDWIDE",
        serviceName: isInternational ? "Express Worldwide" : "Express Domestic",
        estimatedDeliveryDays: isInternational ? "3–5 days" : "1–2 days",
        rate: isInternational ? 2850 : 650,
        currency: "INR",
      },
      {
        provider: LogisticsProvider.DHL,
        carrierName: "DHL Express",
        serviceCode: "DHL_EXPRESS_ENVELOPE",
        serviceName: "Express 12:00 Priority",
        estimatedDeliveryDays: isInternational ? "2–3 days" : "Next Morning",
        rate: isInternational ? 3950 : 950,
        currency: "INR",
      },
    ];
  }

  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    // Generate deterministic yet unique tracking number for DHL
    const timestamp = Date.now().toString().slice(-6);
    const randomHex = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const awbCode = `DHL${timestamp}${randomHex}`;
    const shipmentId = `dhl_shp_${Date.now()}`;

    // Compute ETA (3 business days ahead)
    const eta = new Date();
    eta.setDate(eta.getDate() + 4);

    return {
      success: true,
      provider: this.provider,
      carrierName: "DHL Express",
      serviceName: input.service || "Express Worldwide",
      shipmentId,
      awbCode,
      labelUrl: `/api/admin/shipments/label?carrier=DHL&awb=${awbCode}`,
      estimatedDelivery: eta.toISOString(),
      estimatedDeliveryFrom: eta.toISOString(),
      estimatedDeliveryTo: new Date(eta.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async trackShipment(awbCode: string): Promise<TrackingResult> {
    const now = new Date();
    const createdDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pickupDate = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const transitDate = new Date(now.getTime() - 18 * 60 * 60 * 1000);
    const customsDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    return {
      awbCode,
      provider: this.provider,
      status: "CUSTOMS_CLEARANCE",
      carrierRawStatus: "CUSTOMS_PROCESSING_FACILITY",
      estimatedDelivery: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      activity: [
        {
          date: customsDate.toISOString(),
          status: "CUSTOMS_CLEARANCE",
          carrierStatus: "CLEARANCE_PROCESSING",
          location: "Dubai Hub / Clearance Gateway, UAE",
          description: "Customs declaration documents accepted and cleared for transit",
        },
        {
          date: transitDate.toISOString(),
          status: "IN_TRANSIT",
          carrierStatus: "TRANSIT_DEPARTED",
          location: "Frankfurt Hub, Germany",
          description: "Departed international sorting hub",
        },
        {
          date: pickupDate.toISOString(),
          status: "PICKED_UP",
          carrierStatus: "ORIGIN_PICKUP",
          location: "Mumbai Gateway, India",
          description: "Shipment picked up by DHL Courier",
        },
        {
          date: createdDate.toISOString(),
          status: "LABEL_CREATED",
          carrierStatus: "DATA_RECEIVED",
          location: "Mumbai, India",
          description: "Shipping label generated and transmission verified",
        },
      ],
    };
  }

  async cancelShipment(shipmentId: string, awbCode: string) {
    return { success: true, message: `DHL Shipment ${awbCode} voided successfully.` };
  }
}
