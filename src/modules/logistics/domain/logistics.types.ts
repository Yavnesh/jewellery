export enum LogisticsProvider {
  SHIPROCKET = "SHIPROCKET",
  MOCK = "MOCK"
}

export type ShipmentInput = {
  orderId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  weightKg: number;
  subtotal: number;
};

export type ShipmentResult = {
  success: boolean;
  provider: LogisticsProvider;
  shipmentId: string;
  awbCode: string;
  labelUrl?: string;
  estimatedDelivery?: string;
  error?: string;
};

export type TrackingResult = {
  awbCode: string;
  status: string;
  activity: Array<{
    date: string;
    location: string;
    description: string;
  }>;
};

export interface LogisticsAdapter {
  readonly provider: LogisticsProvider;
  checkPincode(pincode: string): Promise<{ serviceable: boolean; codAvailable: boolean; estimatedDays?: number }>;
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  trackShipment(awbCode: string): Promise<TrackingResult>;
}
