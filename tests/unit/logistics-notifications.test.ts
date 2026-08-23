import { describe, it, expect } from "vitest";
import { gstService } from "../../src/modules/checkout/application/gst.service";
import { logisticsService } from "../../src/modules/logistics/application/logistics.service";
import { smsService } from "../../src/modules/notifications/application/sms.service";
import { LogisticsProvider } from "../../src/modules/logistics/domain/logistics.types";
import { SmsProvider } from "../../src/modules/notifications/domain/sms.types";

describe("GST Service Indian Tax Splits", () => {
  it("splits tax to CGST & SGST for intra-state (Delhi to Delhi)", () => {
    // Subtotal = 10,000 INR (1,000,000 minor units). Jewelry GST is 3%.
    const result = gstService.calculateGST({
      subtotalMinor: 1000000,
      shippingState: "Delhi",
      isJewelryItem: true
    });

    expect(result.taxType).toBe("INTRA_STATE");
    expect(result.totalTaxMinor).toBe(30000); // 3% of 1,000,000 = 30,000
    expect(result.cgstMinor).toBe(15000); // 50% CGST
    expect(result.sgstMinor).toBe(15000); // 50% SGST
    expect(result.igstMinor).toBe(0);
  });

  it("assigns tax to IGST for inter-state (Delhi to Karnataka)", () => {
    // Subtotal = 10,000 INR. Jewelry GST is 3%.
    const result = gstService.calculateGST({
      subtotalMinor: 1000000,
      shippingState: "Karnataka",
      isJewelryItem: true
    });

    expect(result.taxType).toBe("INTER_STATE");
    expect(result.totalTaxMinor).toBe(30000);
    expect(result.cgstMinor).toBe(0);
    expect(result.sgstMinor).toBe(0);
    expect(result.igstMinor).toBe(30000); // Full IGST
  });
});

describe("Logistics Provider Registry (Strategy Pattern)", () => {
  it("resolves the Mock logistics adapter as default and specific adapters when requested", () => {
    const defaultAdapter = logisticsService.get();
    expect(defaultAdapter.provider).toBe(LogisticsProvider.MOCK);

    const shiprocketAdapter = logisticsService.get(LogisticsProvider.SHIPROCKET);
    expect(shiprocketAdapter.provider).toBe(LogisticsProvider.SHIPROCKET);
  });
});

describe("SMS/WhatsApp Gateway Registry (Strategy Pattern)", () => {
  it("resolves specific gateways requested", () => {
    const twilio = smsService.get(SmsProvider.TWILIO);
    expect(twilio.provider).toBe(SmsProvider.TWILIO);

    const gupshup = smsService.get(SmsProvider.GUPSHUP);
    expect(gupshup.provider).toBe(SmsProvider.GUPSHUP);

    const msg91 = smsService.get(SmsProvider.MSG91);
    expect(msg91.provider).toBe(SmsProvider.MSG91);

    const mock = smsService.get(SmsProvider.MOCK);
    expect(mock.provider).toBe(SmsProvider.MOCK);
  });
});
