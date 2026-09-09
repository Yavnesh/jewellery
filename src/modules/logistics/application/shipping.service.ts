import {
  LogisticsAdapter,
  LogisticsProvider,
  ShipmentInput,
  ShipmentResult,
  ShippingRateOption,
  TrackingResult,
  NormalizedShipmentStatus,
} from "../domain/logistics.types";
import { DHLAdapter } from "../infrastructure/dhl-logistics.adapter";
import { FedExAdapter } from "../infrastructure/fedex-logistics.adapter";
import { ShiprocketLogisticsAdapter } from "../infrastructure/shiprocket-logistics.adapter";
import { BlueDartSecuredAdapter } from "../infrastructure/bluedart-logistics.adapter";

export class ShippingService {
  private static instance: ShippingService;
  private adapters: Map<LogisticsProvider | string, LogisticsAdapter> = new Map();

  private constructor() {
    this.adapters.set(LogisticsProvider.DHL, new DHLAdapter());
    this.adapters.set(LogisticsProvider.FEDEX, new FedExAdapter());
    this.adapters.set(LogisticsProvider.SHIPROCKET, new ShiprocketLogisticsAdapter());
    this.adapters.set(LogisticsProvider.BLUEDART, new BlueDartSecuredAdapter());
  }

  public static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService();
    }
    return ShippingService.instance;
  }

  public getAdapter(provider: LogisticsProvider | string): LogisticsAdapter {
    const key = (provider || "BLUEDART").toUpperCase();
    const adapter = this.adapters.get(key) || this.adapters.get(LogisticsProvider.BLUEDART);
    return adapter!;
  }

  public async getAllRates(input: ShipmentInput): Promise<ShippingRateOption[]> {
    const ratePromises: Promise<ShippingRateOption[]>[] = [];
    for (const [_, adapter] of this.adapters.entries()) {
      if (adapter.getRates) {
        ratePromises.push(
          adapter.getRates(input).catch((err) => {
            console.error(`Error getting rates for ${adapter.provider}:`, err);
            return [];
          })
        );
      }
    }

    const results = await Promise.all(ratePromises);
    return results.flat().sort((a, b) => a.rate - b.rate);
  }

  public normalizeStatus(rawStatus: string, provider: string): NormalizedShipmentStatus {
    const normalized = (rawStatus || "").toUpperCase().trim();
    if (
      normalized.includes("DELIVERED") ||
      normalized.includes("COMPLETE") ||
      normalized.includes("SUCCESSFUL_DELIVERY")
    ) {
      return "DELIVERED";
    }
    if (
      normalized.includes("OUT_FOR_DELIVERY") ||
      normalized.includes("WITH_COURIER") ||
      normalized.includes("DISPATCHED_FOR_DELIVERY")
    ) {
      return "OUT_FOR_DELIVERY";
    }
    if (
      normalized.includes("CUSTOMS_HOLD") ||
      normalized.includes("DUTY_PENDING") ||
      normalized.includes("CUSTOMS_DOCUMENTATION_REQUIRED")
    ) {
      return "CUSTOMS_HOLD";
    }
    if (
      normalized.includes("CUSTOMS") ||
      normalized.includes("CLEARANCE") ||
      normalized.includes("EXPORT_GATEWAY")
    ) {
      return "CUSTOMS_CLEARANCE";
    }
    if (
      normalized.includes("IN_TRANSIT") ||
      normalized.includes("TRANSIT") ||
      normalized.includes("MOVING") ||
      normalized.includes("DEPARTED") ||
      normalized.includes("ARRIVED")
    ) {
      return "IN_TRANSIT";
    }
    if (
      normalized.includes("PICKED_UP") ||
      normalized.includes("COLLECTED") ||
      normalized.includes("PACKAGE_RECEIVED")
    ) {
      return "PICKED_UP";
    }
    if (
      normalized.includes("LABEL_CREATED") ||
      normalized.includes("MANIFESTED") ||
      normalized.includes("PRE_DISPATCH") ||
      normalized.includes("DATA_RECEIVED")
    ) {
      return "LABEL_CREATED";
    }
    if (
      normalized.includes("EXCEPTION") ||
      normalized.includes("DELAYED") ||
      normalized.includes("FAILED_ATTEMPT") ||
      normalized.includes("WEATHER_DELAY")
    ) {
      return "EXCEPTION";
    }
    if (
      normalized.includes("RETURNED") ||
      normalized.includes("RTO") ||
      normalized.includes("UNDELIVERABLE")
    ) {
      return "RETURNED";
    }
    if (normalized.includes("CANCELLED") || normalized.includes("VOID")) {
      return "CANCELLED";
    }
    return "IN_TRANSIT";
  }

  public getHumanStatusDescription(status: string): string {
    switch (status) {
      case "NOT_SHIPPED":
        return "Order received. Awaiting vault packaging and carrier allocation.";
      case "LABEL_CREATED":
        return "Shipping label generated and security barcode assigned.";
      case "PICKED_UP":
        return "Package handed over to carrier under sealed custody.";
      case "IN_TRANSIT":
        return "Package is currently moving through carrier transportation hubs.";
      case "CUSTOMS_CLEARANCE":
        return "Cross-border export documents being verified by customs.";
      case "CUSTOMS_HOLD":
        return "Customs requires additional documentation or duty settlement.";
      case "OUT_FOR_DELIVERY":
        return "Out with dedicated courier for handoff (Signature & OTP required).";
      case "DELIVERED":
        return "Package safely delivered to recipient.";
      case "EXCEPTION":
        return "Delivery delayed due to operational or transit exception.";
      case "RETURNED":
        return "Package returned to sender vault.";
      case "CANCELLED":
        return "Shipment cancelled/voided.";
      default:
        return "Shipment in progress.";
    }
  }
}
