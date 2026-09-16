"use client";
import { useProductStore } from "@/app/_zustand/store";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useState } from "react";
import CustomButton from "@/components/CustomButton";
import { useSession } from "next-auth/react";
import { getImagePath } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter, Link } from "@/i18n/routing";
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

export default function CheckoutClient() {
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  // Mobile OTP States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    const cleanDigits = checkoutForm.phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      setFieldErrors(prev => ({ ...prev, phone: "Please enter a valid 10-digit mobile number" }));
      return;
    }

    setIsSendingOtp(true);

    try {
      const { sendOtpAction } = await import("@/app/actions/otp.actions");
      const result = await sendOtpAction({ phone: checkoutForm.phone, purpose: "CHECKOUT" });
      if (result.success) {
        setIsOtpSent(true);
        setResendCountdown(60);
        toast.success(result.message || "OTP sent successfully!");
        if (result.devOtp) {
          toast(`Dev OTP: ${result.devOtp}`, { icon: "🔑", duration: 8000 });
        }
      } else {
        toast.error(result.error || "Failed to send OTP.");
      }
    } catch (err: any) {
      toast.error("Network error while sending OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const { verifyOtpAction } = await import("@/app/actions/otp.actions");
      const result = await verifyOtpAction({ phone: checkoutForm.phone, otp, purpose: "CHECKOUT" });
      if (result.success) {
        setIsPhoneVerified(true);
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.phone;
          return next;
        });
        toast.success("Mobile number verified successfully!");
      } else {
        toast.error(result.error || "OTP verification failed.");
      }
    } catch (err: any) {
      toast.error("Network error during verification.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validateAll = () => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!checkoutForm.name.trim() || checkoutForm.name.trim().length < 2) {
      errors.name = "First name must be at least 2 characters";
    }

    // Lastname validation
    if (!checkoutForm.lastname.trim() || checkoutForm.lastname.trim().length < 2) {
      errors.lastname = "Last name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!checkoutForm.email.trim() || !emailRegex.test(checkoutForm.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (must be at least 10 digits)
    const phoneDigits = checkoutForm.phone.replace(/[^0-9]/g, "");
    if (!checkoutForm.phone.trim() || phoneDigits.length < 10) {
      errors.phone = "Phone number must be at least 10 digits";
    }

    // Company validation
    if (!checkoutForm.company.trim() || checkoutForm.company.trim().length < 2) {
      errors.company = "Company name must be at least 2 characters";
    }

    // Address validation
    if (!checkoutForm.adress.trim() || checkoutForm.adress.trim().length < 5) {
      errors.adress = "Address must be at least 5 characters";
    }

    // Apartment validation
    if (!checkoutForm.apartment.trim() || checkoutForm.apartment.trim().length < 1) {
      errors.apartment = "Apartment, suite, etc. is required";
    }

    // City validation
    if (!checkoutForm.city.trim() || checkoutForm.city.trim().length < 2) {
      errors.city = "City must be at least 2 characters";
    }

    // Country validation
    if (!checkoutForm.country.trim() || checkoutForm.country.trim().length < 2) {
      errors.country = "Country must be at least 2 characters";
    }

    // Postal code validation
    if (!checkoutForm.postalCode.trim() || checkoutForm.postalCode.trim().length < 3) {
      errors.postalCode = "Postal code must be at least 3 characters";
    }

    return errors;
  };

  const handleInputChange = (field: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((prev) => ({ ...prev, [field]: value }));
    if (field === "phone") {
      setIsPhoneVerified(false);
      setIsOtpSent(false);
      setOtp("");
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const makePurchase = async () => {
    // Client-side validation first
    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstField = Object.keys(errors)[0];
      const el = document.getElementById(
        firstField === "adress"
          ? "address"
          : firstField === "postalCode"
          ? "postal-code"
          : firstField === "country"
          ? "region"
          : firstField === "email"
          ? "email-address"
          : `${firstField}-input`
      );
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please correct the highlighted fields.");
      return;
    }

    if (!isPhoneVerified && !session?.user) {
      setFieldErrors(prev => ({ ...prev, phone: "Mobile verification required via OTP" }));
      const phoneEl = document.getElementById("phone-input");
      if (phoneEl) phoneEl.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please verify your mobile number with OTP before placing your order.");
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
        state: checkoutForm.country.trim(),
        country: checkoutForm.country.trim(),
        postalCode: checkoutForm.postalCode.trim(),
        orderNotice: checkoutForm.orderNotice.trim(),
      });

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
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
      setFieldErrors({});

      clearCart();

      if (result.clientAction && result.clientAction.type === "REDIRECT") {
        toast.success("Order created! Redirecting to secure payment...");
        if (result.clientAction.redirectUrl.startsWith("http://") || result.clientAction.redirectUrl.startsWith("https://")) {
          window.location.href = result.clientAction.redirectUrl;
        } else {
          router.push(result.clientAction.redirectUrl);
        }
      } else if (result.clientAction && result.clientAction.type === "SDK") {
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

  if (products.length === 0) {
    return (
      <div className="bg-luxury-bg min-h-screen pt-24 pb-16 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-serif text-luxury-text-primary mb-4">Your Shopping Bag is Empty</h1>
        <p className="text-sm font-sans text-luxury-text-secondary mb-8">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="bg-luxury-gold text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-luxury-gold/90 transition-colors">
          Browse Collections
        </Link>
      </div>
    );
  }

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
                <dd>Free</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-luxury-text-secondary">Taxes</dt>
                <dd>₹{total / 5}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-luxury-border/40 pt-6">
                <dt className="text-base font-serif font-bold">Total</dt>
                <dd className="text-xl font-serif font-bold text-luxury-gold">
                  ₹{total === 0 ? 0 : Math.round(total + total / 5)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <form className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0" onSubmit={(e) => e.preventDefault()}>
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
                  Name * <span className="text-xs text-luxury-text-secondary font-normal">(min 2 characters)</span>
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    type="text"
                    id="name-input"
                    name="name-input"
                    autoComplete="given-name"
                    required
                    disabled={isSubmitting}
                    className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                      fieldErrors.name
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="lastname-input"
                  className="block text-sm font-sans font-medium text-luxury-text-primary"
                >
                  Lastname * <span className="text-xs text-luxury-text-secondary font-normal">(min 2 characters)</span>
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.lastname}
                    onChange={(e) => handleInputChange("lastname", e.target.value)}
                    type="text"
                    id="lastname-input"
                    name="lastname-input"
                    autoComplete="family-name"
                    required
                    disabled={isSubmitting}
                    className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                      fieldErrors.lastname
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                    }`}
                  />
                  {fieldErrors.lastname && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.lastname}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone number with OTP Verification */}
              <div className="mt-6 p-4 bg-[#FAF8F5] border border-[#EBE3D7] rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="phone-input"
                    className="block text-sm font-sans font-semibold text-luxury-text-primary"
                  >
                    Phone number * <span className="text-xs text-luxury-text-secondary font-normal">(10 digits)</span>
                  </label>
                  {isPhoneVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm font-medium">
                      +91
                    </span>
                    <input
                      value={checkoutForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        handleInputChange("phone", val);
                      }}
                      type="tel"
                      id="phone-input"
                      name="phone-input"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      required
                      disabled={isSubmitting || isPhoneVerified}
                      className={`block w-full rounded-sm bg-white py-2.5 pl-12 pr-3 text-luxury-text-primary shadow-sm sm:text-sm transition duration-150 ${
                        isPhoneVerified
                          ? "bg-gray-100 text-gray-600 ring-1 ring-green-500 cursor-not-allowed"
                          : fieldErrors.phone
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border border-gray-300 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                    />
                  </div>

                  {!isPhoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || checkoutForm.phone.replace(/\D/g, "").length < 10 || resendCountdown > 0}
                      className="px-4 py-2.5 bg-[#8B2C33] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#6e2329] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                    >
                      {isSendingOtp
                        ? "Sending..."
                        : resendCountdown > 0
                        ? `Resend (${resendCountdown}s)`
                        : isOtpSent
                        ? "Resend OTP"
                        : "Verify OTP"}
                    </button>
                  )}
                </div>

                {fieldErrors.phone && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-sans">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.phone}
                  </p>
                )}

                {/* OTP Input Section on Checkout */}
                {isOtpSent && !isPhoneVerified && (
                  <div className="pt-2 border-t border-[#E3D6C5] space-y-2">
                    <p className="text-xs text-gray-600">
                      Enter the 6-digit verification code sent to your mobile:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit OTP"
                        className="block w-full rounded-sm border border-gray-300 py-2 px-3 text-gray-900 shadow-sm tracking-widest font-mono text-center placeholder:tracking-normal placeholder:font-sans focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otp.trim().length !== 6}
                        className="px-4 py-2 bg-[#D1A254] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#b58b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                      >
                        {isVerifyingOtp ? "Verifying..." : "Confirm OTP"}
                      </button>
                    </div>
                  </div>
                )}
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
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    type="email"
                    id="email-address"
                    name="email-address"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                      fieldErrors.email
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.email}
                    </p>
                  )}
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
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.company
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                    />
                    {fieldErrors.company && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="address"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Address * <span className="text-xs text-luxury-text-secondary font-normal">(min 5 characters)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      required
                      disabled={isSubmitting}
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.adress
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.adress}
                      onChange={(e) => handleInputChange("adress", e.target.value)}
                    />
                    {fieldErrors.adress && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.adress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="apartment"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Apartment, suite, etc. *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      required
                      disabled={isSubmitting}
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.apartment
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.apartment}
                      onChange={(e) => handleInputChange("apartment", e.target.value)}
                    />
                    {fieldErrors.apartment && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.apartment}
                      </p>
                    )}
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
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.city
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                    {fieldErrors.city && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Country / State *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="region"
                      name="region"
                      autoComplete="address-level1"
                      required
                      disabled={isSubmitting}
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.country
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                    />
                    {fieldErrors.country && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.country}
                      </p>
                    )}
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
                      className={`block w-full rounded-sm bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ${
                        fieldErrors.postalCode
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-luxury-border/40 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
                      }`}
                      value={checkoutForm.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    />
                    {fieldErrors.postalCode && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-sans">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="order-notice"
                    className="block text-sm font-sans font-medium text-luxury-text-primary"
                  >
                    Order notice <span className="text-xs text-luxury-text-secondary font-normal">(optional)</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      className="block w-full rounded-sm border-luxury-border/40 bg-transparent py-2.5 px-3 text-luxury-text-primary shadow-sm focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[100px]"
                      id="order-notice"
                      name="order-notice"
                      autoComplete="order-notice"
                      disabled={isSubmitting}
                      value={checkoutForm.orderNotice}
                      onChange={(e) => handleInputChange("orderNotice", e.target.value)}
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
}
