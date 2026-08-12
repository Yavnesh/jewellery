import { NextRequest, NextResponse } from "next/server";
import { checkoutService, CheckoutRequest } from "@/src/modules/checkout/application/checkout.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const input: CheckoutRequest = {
      cartId: body.cartId,
      shippingAddressId: body.shippingAddressId,
      billingAddressId: body.billingAddressId,
      userId: session.user.id,
      idempotencyKey: req.headers.get("Idempotency-Key") || crypto.randomUUID(), // Fallback if client doesn't send
    };

    const result = await checkoutService.processCheckout(input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Checkout API Error:", error);
    // Don't leak internal error messages to client unless safe
    return NextResponse.json(
      { error: "Checkout failed", message: error.message },
      { status: 400 }
    );
  }
}
