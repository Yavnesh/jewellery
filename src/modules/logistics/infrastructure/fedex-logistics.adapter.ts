import {
  LogisticsAdapter,
  LogisticsProvider,
  ShipmentInput,
  ShipmentResult,
  ShippingRateOption,
  TrackingResult,
} from "../domain/logistics.types";

export class FedExAdapter implements LogisticsAdapter {
  public readonly provider = LogisticsProvider.FEDEX;

  async getRates(input: ShipmentInput): Promise<ShippingRateOption[]> {
    const isInternational = input.country.toUpperCase() !== "IN" && input.country.toUpperCase() !== "INDIA";
    return [
      {
        provider: LogisticsProvider.FEDEX,
        carrierName: "FedEx",
        serviceCode: "FEDEX_INTERNATIONAL_PRIORITY",
        serviceName: isInternational ? "International Priority" : "FedEx Priority Overnight",
        estimatedDeliveryDays: isInternational ? "3–4 days" : "1 day",
        rate: isInternational ? 3100 : 720,
        currency: "INR",
      },
      {
        provider: LogisticsProvider.FEDEX,
        carrierName: "FedEx",
        serviceCode: "FEDEX_INTERNATIONAL_ECONOMY",
        serviceName: isInternational ? "International Economy" : "FedEx Standard Express",
        estimatedDeliveryDays: isInternational ? "5–7 days" : "2–3 days",
        rate: isInternational ? 2200 : 490,
        currency: "INR",
      },
    ];
  }

  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    const timestamp = Date.now().toString().slice(-8);
    const awbCode = `FDX${timestamp}`;
    const shipmentId = `fdx_shp_${Date.now()}`;

    const eta = new Date();
    eta.setDate(eta.getDate() + 3);

    return {
      success: true,
      provider: this.provider,
      carrierName: "FedEx",
      serviceName: input.service || "International Priority",
      shipmentId,
      awbCode,
      labelUrl: `/api/admin/shipments/label?carrier=FEDEX&awb=${awbCode}`,
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
      status: "IN_TRANSIT",
      carrierRawStatus: "IN_TRANSIT_ON_SCHEDULE",
      estimatedDelivery: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      activity: [
        {
          date: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          status: "IN_TRANSIT",
          carrierStatus: "DEPARTED_FACILITY",
          location: "Memphis SuperHub, TN, USA",
          description: "International consignment departed transit gateway",
        },
        {
          date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: "PICKED_UP",
          carrierStatus: "PACKAGE_RECEIVED",
          location: "New Delhi Airport Logistics Park, India",
          description: "Picked up and cleared for overseas freight",
        },
        {
          date: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          status: "LABEL_CREATED",
          carrierStatus: "SHIPMENT_INFO_SENT",
          location: "New Delhi, India",
          description: "Shipment documentation created electronically",
        },
      ],
    };
  }

  async cancelShipment(shipmentId: string, awbCode: string) {
    return { success: true, message: `FedEx Tracking ${awbCode} cancelled.` };
  }
}
