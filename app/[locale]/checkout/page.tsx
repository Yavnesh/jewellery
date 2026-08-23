"use client";
import { useProductStore } from "@/app/_zustand/store";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useState } from "react";
import CustomButton from "@/components/CustomButton";
import { useSession } from "next-auth/react";
import { getImagePath } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { data: session } = useSession();
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  // Add validation functions that match server requirements
  const validateForm = () => {
    const errors: string[] = [];
    
    // Name validation
    if (!checkoutForm.name.trim() || checkoutForm.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    
    // Lastname validation
    if (!checkoutForm.lastname.trim() || checkoutForm.lastname.trim().length < 2) {
      errors.push("Lastname must be at least 2 characters");
    }
    
    // Email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!checkoutForm.email.trim() || !emailRegex.test(checkoutForm.email.trim())) {
      errors.push("Please enter a valid email address");
    }
    
    // Phone validation (must be at least 10 digits)
    const phoneDigits = checkoutForm.phone.replace(/[^0-9]/g, '');
    if (!checkoutForm.phone.trim() || phoneDigits.length < 10) {
      errors.push("Phone number must be at least 10 digits");
    }
    
    // Company validation
    if (!checkoutForm.company.trim() || checkoutForm.company.trim().length < 5) {
      errors.push("Company must be at least 5 characters");
    }
    
    // Address validation
    if (!checkoutForm.adress.trim() || checkoutForm.adress.trim().length < 5) {
      errors.push("Address must be at least 5 characters");
    }
    
    // Apartment validation (updated to 1 character minimum)
    if (!checkoutForm.apartment.trim() || checkoutForm.apartment.trim().length < 1) {
      errors.push("Apartment is required");
    }
    
    // City validation
    if (!checkoutForm.city.trim() || checkoutForm.city.trim().length < 5) {
      errors.push("City must be at least 5 characters");
    }
    
    // Country validation
    if (!checkoutForm.country.trim() || checkoutForm.country.trim().length < 5) {
      errors.push("Country must be at least 5 characters");
    }
    
    // Postal code validation
    if (!checkoutForm.postalCode.trim() || checkoutForm.postalCode.trim().length < 3) {
      errors.push("Postal code must be at least 3 characters");
    }
    
    return errors;
  };

  const makePurchase = async () => {
    // Client-side validation first
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    if (products.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Lazy import Server Action
      const { submitCheckout } = await import("@/app/actions/checkout.actions");
      
      const result = await submitCheckout({
        name: checkoutForm.name.trim(),
        lastname: checkoutForm.lastname.trim(),
        phone: checkoutForm.phone.trim(),
        email: checkoutForm.email.trim().toLowerCase(),
        company: checkoutForm.company.trim(),
        adress: checkoutForm.adress.trim(),
        apartment: checkoutForm.apartment.trim(),
        city: checkoutForm.city.trim(),
        state: "",
        country: checkoutForm.country.trim(),
        postalCode: checkoutForm.postalCode.trim(),
        orderNotice: checkoutForm.orderNotice.trim(),
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create order");
        setIsSubmitting(false);
        return;
      }

      // Clear form and optimistic cart
      setCheckoutForm({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        company: "",
        adress: "",
        apartment: "",
        city: "",
        country: "",
        postalCode: "",
        orderNotice: "",
      });
      
      clearCart();
      
      if (result.clientAction && result.clientAction.type === 'REDIRECT') {
        toast.success("Order created! Redirecting to secure payment...");
        router.push(result.clientAction.redirectUrl);
      } else if (result.clientAction && result.clientAction.type === 'SDK') {
        // Handle Razorpay
        toast.success("Order created! Opening secure payment window...");
        
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
          return;
        }

        const options = {
          key: result.clientAction.publicKey,
          amount: Math.round((total + total / 5 + 5) * 100), // Minor units
          currency: "INR",
          name: "Vamika Jewels",
          description: "Secure Checkout",
          order_id: result.clientAction.sessionId,
          handler: async function (response: any) {
            toast.loading("Verifying payment...", { id: "payment-verify" });
            const { verifyPaymentSignatureAction } = await import("@/app/actions/verify-payment.actions");
            
            const verifyResult = await verifyPaymentSignatureAction({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              toast.success("Payment verified successfully!", { id: "payment-verify" });
              router.push(!session?.user ? "/?checkout_success=guest" : "/");
            } else {
              toast.error("Payment verification failed.", { id: "payment-verify" });
            }
          },
          prefill: {
            name: checkoutForm.name + " " + checkoutForm.lastname,
            email: checkoutForm.email,
            contact: checkoutForm.phone,
          },
          theme: {
            color: "#D3A971", // luxury-gold
          },
        };
        
        const rzp = new (window as any).Razorpay(options);
        
        rzp.on("payment.failed", function (response: any) {
          toast.error("Payment failed or cancelled");
          console.error(response.error);
        });
        
        rzp.open();
        
      } else {
        toast.success("Order created successfully! You will be contacted for payment.");
        setTimeout(() => {
          router.push(!session?.user ? "/?checkout_success=guest" : "/");
        }, 1000);
      }
      
    } catch (error: any) {
      console.error("💥 Error in makePurchase:", error);
      toast.error("Failed to create order. Please try again.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, []);

  return (
    <div className="bg-luxury-bg min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h1 className="text-4xl font-serif text-luxury-text-primary tracking-wide">
          Secure Checkout
        </h1>
      </div>

      <main className="relative mx-auto grid max-w-screen-2xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-24">
        <h2 className="sr-only">Order information</h2>

        {/* Order Summary */}
        <section
          aria-labelledby="summary-heading"
          className="bg-luxury-ivory border border-luxury-border/60 rounded-sm px-4 pb-10 pt-10 sm:px-6 lg:col-start-2 lg:row-start-1 lg:px-8 lg:pb-16"
        >
          <div className="mx-auto max-w-lg lg:max-w-none">
            <h2 id="summary-heading" className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-4">
              Order Summary
            </h2>

            <ul
              role="list"
              className="divide-y divide-luxury-border/40 text-sm font-sans font-medium text-luxury-text-primary"
            >
              {products.map((product) => (
                <li key={product?.id} className="flex items-start space-x-4 py-6">
                  <Image
                    src={getImagePath(product?.image)}
                    alt={product?.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none rounded-md object-cover object-center"
                  />
                  <div className="flex-auto space-y-1">
                    <h3 className="font-serif text-base">{product?.title}</h3>
                    <p className="text-luxury-text-secondary text-xs font-sans">Qty: {product?.amount}</p>
                  </div>
                  <p className="flex-none text-base font-serif font-bold text-luxury-gold">
                    ₹{product?.price}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="hidden space-y-6 border-t border-luxury-border/40 pt-6 text-sm font-sans font-medium text-luxury-text-primary lg:block">
              <div className="flex items-center justify-between">
                <dt className="text-luxury-text-secondary">Subtotal</dt>
                <dd>₹{total}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-luxury-text-secondary">Shipping</dt>
                <dd>₹5</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-luxury-text-secondary">Taxes</dt>
                <dd>₹{total / 5}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-luxury-border/40 pt-6">
                <dt className="text-base font-serif font-bold">Total</dt>
                <dd className="text-xl font-serif font-bold text-luxury-gold">
                  ₹{total === 0 ? 0 : Math.round(total + total / 5 + 5)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <form className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0">
          <div className="mx-auto max-w-lg lg:max-w-none">
            {/* Contact Information */}
            <section aria-labelledby="contact-info-heading">
              <h2
                id="contact-info-heading"
                className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-4"
              >
                Contact Information
              </h2>

              <div className="mt-6">
                <label
                  htmlFor="name-input"
                  className="block text-sm font-sans font-medium text-luxury-text-primary"
                >
                  Name * (min 2 characters)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.name}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        name: e.target.value,
                      })
                    }
                    type="text"
                    id="name-input"
                    name="name-input"
                    autoComplete="given-name"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="lastname-input"
                  className="block text-sm font-sans font-medium text-luxury-text-primary"
                >
                  Lastname * (min 2 characters)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.lastname}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        lastname: e.target.value,
                      })
                    }
                    type="text"
                    id="lastname-input"
                    name="lastname-input"
                    autoComplete="family-name"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="phone-input"
                  className="block text-sm font-sans font-medium text-luxury-text-primary"
                >
                  Phone number * (min 10 digits)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.phone}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        phone: e.target.value,
                      })
                    }
                    type="tel"
                    id="phone-input"
                    name="phone-input"
                    autoComplete="tel"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="email-address"
                  className="block text-sm font-sans font-medium text-luxury-text-primary"
                >
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.email}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    id="email-address"
                    name="email-address"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Payment Notice */}
            <section className="mt-10">
              <div className="bg-[#FFF8E7] border border-[#9C7740]/20 rounded-sm p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-[#9C7740]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-serif font-bold text-[#9C7740]">
                      Payment Information
                    </h3>
                    <div className="mt-1 text-xs font-sans text-[#9C7740]/80">
                      <p>Payment will be processed after order confirmation. You will be contacted for payment details.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section aria-labelledby="shipping-heading" className="mt-10">
              <h2
                id="shipping-heading"
                className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-4"
              >
                Shipping Address
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="company"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Company *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.company}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          company: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="address"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Address *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.adress}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          adress: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="apartment"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Apartment, suite, etc. * (required)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.apartment}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          apartment: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    City *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.city}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Country *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="region"
                      name="region"
                      autoComplete="address-level1"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.country}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="postal-code"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Postal code *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="postal-code"
                      name="postal-code"
                      autoComplete="postal-code"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.postalCode}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          postalCode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="order-notice"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Order notice
                  </label>
                  <div className="mt-1">
                    <textarea
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[100px]"
                      id="order-notice"
                      name="order-notice"
                      autoComplete="order-notice"
                      disabled={isSubmitting}
                      value={checkoutForm.orderNotice}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          orderNotice: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10 pt-6">
              <button
                type="button"
                onClick={makePurchase}
                disabled={isSubmitting}
                className="w-full uppercase tracking-widest flex justify-center items-center bg-luxury-gold px-4 py-4 text-[13px] font-bold text-white shadow-sm hover:bg-luxury-gold/90 transition duration-200 focus:outline-none focus:ring-2 focus:ring-luxury-gold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing Order..." : "Place Secure Order"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutPage;
