import { LogisticsAdapter, LogisticsProvider, ShipmentInput, ShipmentResult, TrackingResult } from "../domain/logistics.types";

export class MockLogisticsAdapter implements LogisticsAdapter {
  public readonly provider = LogisticsProvider.MOCK;

  async checkPincode(pincode: string) {
    // Standard mock: active serviceability for any 6 digit pincode
    const isValid = /^\d{6}$/.test(pincode);
    return {
      serviceable: isValid,
      codAvailable: isValid && !pincode.startsWith("9"),
      estimatedDays: 3
    };
  }

  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    return {
      success: true,
      provider: this.provider,
      shipmentId: `mock_ship_${Math.floor(Math.random() * 1000000)}`,
      awbCode: `AWB${Math.floor(Math.random() * 100000000)}`,
      labelUrl: "https://example.com/mock-label.pdf",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async trackShipment(awbCode: string): Promise<TrackingResult> {
    return {
      awbCode,
      status: "In Transit",
      activity: [
        {
          date: new Date().toISOString(),
          location: "Delhi Hub",
          description: "Package received and sorted"
        }
      ]
    };
  }
}
