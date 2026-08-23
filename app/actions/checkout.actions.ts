"use server";

import { checkoutService } from "@/src/modules/checkout/application/checkout.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

interface CheckoutInputPayload {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  company: string;
  adress: string;
  apartment: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  orderNotice?: string;
}

export async function submitCheckout(inputData: CheckoutInputPayload) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const input = {
      ...inputData,
      userId
    };

    // Basic validation
    if (!input.name || !input.email || !input.adress || !input.city || !input.state) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const { order, paymentIntent } = await checkoutService.processCheckout({
      shippingDetails: input,
      userId,
      idempotencyKey: `action_checkout_${userId || "guest"}_${Date.now()}`,
    });

    // Revalidate the entire site cache to update stock quantities on product pages
    revalidatePath("/", "layout");

    return { 
      success: true, 
      orderId: order.id, 
      clientAction: paymentIntent.clientAction 
    };
  } catch (error: any) {
    console.error("Checkout error:", error);
    return { success: false, error: error.message || "Failed to process checkout" };
  }
}
