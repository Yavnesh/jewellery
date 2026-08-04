"use server";

import { processCheckout } from "@/lib/checkout/checkout.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { cookies } from "next/headers";

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
    if (!input.name || !input.email || !input.adress || !input.city) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const { order, paymentIntent } = await processCheckout(input);

    // After successful checkout, clear the cart session cookie if guest, 
    // or just rely on the cart being marked as CONVERTED.
    // The next call to getActiveCart will create a new one automatically.
    
    return { 
      success: true, 
      orderId: order.id, 
      clientSecret: paymentIntent?.clientSecret 
    };
  } catch (error: any) {
    console.error("Checkout error:", error);
    return { success: false, error: error.message || "Failed to process checkout" };
  }
}
