import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/adminAuthHelper";
import { ShippingService } from "@/src/modules/logistics/application/shipping.service";
import { LogisticsProvider } from "@/src/modules/logistics/domain/logistics.types";

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const {
      country = "India",
      postalCode = "400050",
      weightKg = 0.5,
      subtotal = 50000,
    } = body;

    const shippingService = ShippingService.getInstance();
    const rates = await shippingService.getAllRates({
      orderId: "quote",
      provider: LogisticsProvider.BLUEDART,
      customerName: "Quote Request",
      phone: "+910000000000",
      email: "quote@example.com",
      address: "Quote Address",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode,
      country,
      weightKg: Number(weightKg) || 0.5,
      subtotal: Number(subtotal) || 50000,
      items: [],
    });

    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error("Rates fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate shipping rates" }, { status: 500 });
  }
}
