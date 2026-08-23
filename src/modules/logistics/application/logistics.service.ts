import { LogisticsAdapter, LogisticsProvider } from "../domain/logistics.types";
import { MockLogisticsAdapter } from "../infrastructure/mock-logistics.adapter";
import { ShiprocketLogisticsAdapter } from "../infrastructure/shiprocket-logistics.adapter";

export class LogisticsService {
  private adapters: Map<LogisticsProvider, LogisticsAdapter> = new Map();
  private defaultProvider: LogisticsProvider = LogisticsProvider.MOCK;

  constructor() {
    this.register(new MockLogisticsAdapter());
    this.register(new ShiprocketLogisticsAdapter());

    // Resolve default provider from environment variable configuration
    const configured = process.env.LOGISTICS_PROVIDER as LogisticsProvider;
    if (configured && Object.values(LogisticsProvider).includes(configured)) {
      this.defaultProvider = configured;
    }
  }

  register(adapter: LogisticsAdapter) {
    this.adapters.set(adapter.provider, adapter);
  }

  get(provider?: LogisticsProvider): LogisticsAdapter {
    const selected = provider || this.defaultProvider;
    const adapter = this.adapters.get(selected);
    if (!adapter) {
      throw new Error(`Logistics provider ${selected} is not registered`);
    }
    return adapter;
  }
}

export const logisticsService = new LogisticsService();
