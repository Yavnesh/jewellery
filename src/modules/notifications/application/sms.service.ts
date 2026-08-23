import { SmsAdapter, SmsProvider } from "../domain/sms.types";
import { MockSmsAdapter, TwilioSmsAdapter, GupshupSmsAdapter, Msg91SmsAdapter } from "../infrastructure/sms-adapters";

export class SmsService {
  private adapters: Map<SmsProvider, SmsAdapter> = new Map();
  private defaultProvider: SmsProvider = SmsProvider.MOCK;

  constructor() {
    this.register(new MockSmsAdapter());
    this.register(new TwilioSmsAdapter());
    this.register(new GupshupSmsAdapter());
    this.register(new Msg91SmsAdapter());

    // Resolve default SMS/WhatsApp gateway provider from configuration
    const configured = process.env.SMS_PROVIDER as SmsProvider;
    if (configured && Object.values(SmsProvider).includes(configured)) {
      this.defaultProvider = configured;
    }
  }

  register(adapter: SmsAdapter) {
    this.adapters.set(adapter.provider, adapter);
  }

  get(provider?: SmsProvider): SmsAdapter {
    const selected = provider || this.defaultProvider;
    const adapter = this.adapters.get(selected);
    if (!adapter) {
      throw new Error(`SMS/WhatsApp gateway provider ${selected} is not registered`);
    }
    return adapter;
  }
}

export const smsService = new SmsService();
