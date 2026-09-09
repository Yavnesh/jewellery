export enum LogisticsProvider {
  DHL = "DHL",
  FEDEX = "FEDEX",
  SHIPROCKET = "SHIPROCKET",
  BLUEDART = "BLUEDART",
  MANUAL = "MANUAL",
  MOCK = "MOCK",
}

export type NormalizedShipmentStatus =
  | "NOT_SHIPPED"
  | "LABEL_CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "CUSTOMS_CLEARANCE"
  | "CUSTOMS_HOLD"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED"
  | "CANCELLED";

export interface CustomsDeclaration {
  originCountry: string;
  hsCode?: string;
  declaredValue: number;
  currency: string;
  exportReason: string; // "Commercial Sale", "Gift", "Sample", "Repair"
  incoterm: string; // "DDP" (Delivered Duty Paid), "DAP" (Delivered at Place)
  dutiesPayer: "SENDER" | "RECIPIENT";
  itemsSummary?: string;
}

export interface ShipmentLineItemInput {
  orderProductId: string;
  quantity: number;
  title?: string;
  sku?: string;
  price?: number;
}

export interface ShipmentInput {
  orderId: string;
  provider: LogisticsProvider | string;
  carrierName?: string;
  service?: string;
  customerName: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packageCount?: number;
  subtotal: number;
  items: ShipmentLineItemInput[];
  customs?: CustomsDeclaration;
  insuranceValue?: number;
  signatureRequired?: boolean;
}

export interface ShippingRateOption {
  provider: LogisticsProvider;
  carrierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDeliveryDays: string;
  rate: number;
  currency: string;
}

export interface ShipmentResult {
  success: boolean;
  provider: LogisticsProvider | string;
  carrierName: string;
  serviceName?: string;
  shipmentId: string;
  awbCode: string;
  labelUrl?: string;
  estimatedDelivery?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  error?: string;
  rawPayload?: any;
}

export interface TrackingActivity {
  date: string;
  status: NormalizedShipmentStatus | string;
  carrierStatus?: string;
  location: string;
  description: string;
  rawPayload?: any;
}

export interface TrackingResult {
  awbCode: string;
  provider: LogisticsProvider | string;
  status: NormalizedShipmentStatus;
  carrierRawStatus: string;
  estimatedDelivery?: string;
  activity: TrackingActivity[];
}

export interface LogisticsAdapter {
  readonly provider: LogisticsProvider;
  checkPincode?(pincode: string, country?: string): Promise<{ serviceable: boolean; codAvailable: boolean; estimatedDays?: number }>;
  getRates?(input: ShipmentInput): Promise<ShippingRateOption[]>;
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  trackShipment(awbCode: string): Promise<TrackingResult>;
  cancelShipment?(shipmentId: string, awbCode: string): Promise<{ success: boolean; message?: string }>;
  generateLabel?(shipmentId: string, awbCode: string): Promise<{ success: boolean; labelUrl: string }>;
}
