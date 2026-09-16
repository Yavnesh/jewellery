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
      state: inputData.state || inputData.country || inputData.city || "Default",
      userId
    };

    // Field-level validation checks
    const fieldErrors: Record<string, string> = {};

    if (!input.name || input.name.trim().length < 2) {
      fieldErrors.name = "First name must be at least 2 characters.";
    }
    if (!input.lastname || input.lastname.trim().length < 2) {
      fieldErrors.lastname = "Last name must be at least 2 characters.";
    }
    const phoneDigits = (input.phone || "").replace(/[^0-9]/g, "");
    if (!input.phone || phoneDigits.length < 10) {
      fieldErrors.phone = "Phone number must be at least 10 digits.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email || !emailRegex.test(input.email.trim())) {
      fieldErrors.email = "Please enter a valid email address.";
    }
    if (!input.company || input.company.trim().length < 2) {
      fieldErrors.company = "Company name must be at least 2 characters.";
    }
    if (!input.adress || input.adress.trim().length < 5) {
      fieldErrors.adress = "Street address must be at least 5 characters.";
    }
    if (!input.apartment || input.apartment.trim().length < 1) {
      fieldErrors.apartment = "Apartment, suite, or unit number is required.";
    }
    if (!input.city || input.city.trim().length < 2) {
      fieldErrors.city = "City must be at least 2 characters.";
    }
    if (!input.country || input.country.trim().length < 2) {
      fieldErrors.country = "Country / Region is required.";
    }
    if (!input.postalCode || input.postalCode.trim().length < 3) {
      fieldErrors.postalCode = "Postal code must be at least 3 characters.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      const firstError = Object.values(fieldErrors)[0];
      return { 
        success: false, 
        error: firstError, 
        fieldErrors 
      };
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
