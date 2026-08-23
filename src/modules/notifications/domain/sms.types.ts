export enum SmsProvider {
  TWILIO = "TWILIO",
  GUPSHUP = "GUPSHUP",
  MSG91 = "MSG91",
  MOCK = "MOCK"
}

export interface SmsAdapter {
  readonly provider: SmsProvider;
  sendSms(to: string, message: string): Promise<boolean>;
  sendOtp(to: string, code: string): Promise<boolean>;
}
