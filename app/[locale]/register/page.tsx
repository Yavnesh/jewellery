"use client";
import { CustomButton, SectionTitle } from "@/components";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sendOtpAction, verifyOtpAction } from "@/app/actions/otp.actions";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // Mobile & OTP States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerifiedState, setIsPhoneVerifiedState] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSendingOtp(true);
    setError("");

    try {
      const result = await sendOtpAction({ phone, purpose: "REGISTRATION" });
      if (result.success) {
        setIsOtpSent(true);
        setResendCountdown(60);
        toast.success(result.message || "OTP sent successfully!");
        if (result.devOtp) {
          toast(`Dev OTP: ${result.devOtp}`, { icon: "🔑", duration: 8000 });
        }
      } else {
        toast.error(result.error || "Failed to send OTP.");
        setError(result.error || "Failed to send OTP.");
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
    setError("");

    try {
      const result = await verifyOtpAction({ phone, otp, purpose: "REGISTRATION" });
      if (result.success) {
        setIsPhoneVerifiedState(true);
        toast.success("Mobile number verified successfully!");
      } else {
        toast.error(result.error || "OTP verification failed.");
        setError(result.error || "OTP verification failed.");
      }
    } catch (err: any) {
      toast.error("Network error during verification.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    const lastname = e.target.lastname.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmpassword.value;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!isPhoneVerifiedState) {
      setError("Please verify your mobile number with OTP before creating your account.");
      toast.error("Please verify your mobile number with OTP.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (confirmPassword !== password) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    const genericErrorMsg = "Registration failed. Please try again.";

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone, name, lastname }),
      });

      const data = await res.json();

      if (res.ok) {
        setError("");
        toast.success("Registration successful! You can now log in.");
        router.push("/login");
      } else {
        if (data.details && Array.isArray(data.details)) {
          const errorMessage = data.details.map((err: any) => err.message).join(", ");
          setError(errorMessage);
          toast.error(errorMessage);
        } else if (res.status === 409 || data.error?.includes("exists")) {
          setError("We couldn't create an account with those details.");
          toast.error("We couldn't create an account with those details.");
        } else {
          setError(data.error || genericErrorMsg);
          toast.error(data.error || genericErrorMsg);
        }
      }
    } catch (error) {
      setError(genericErrorMsg);
      toast.error(genericErrorMsg);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    import("next-auth/react").then(({ signIn }) => {
      signIn(provider, { callbackUrl: "/" });
    });
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-500 font-medium animate-pulse">Loading securely...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <SectionTitle title="Register" path="Home | Register" />
      <div className="flex min-h-[70vh] flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white">
        <div className="flex justify-center flex-col items-center">
          <h2 className="mt-6 text-center text-3xl font-medium tracking-tight text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join us to discover timeless jewelry
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
          <div className="bg-white px-6 py-10 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    First Name *
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium leading-6 text-gray-900">
                    Last Name *
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number & OTP Verification Field */}
              <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D7] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-900">
                    Mobile Number *
                  </label>
                  {isPhoneVerifiedState && (
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
                      id="phone"
                      name="phone"
                      type="tel"
                      disabled={isPhoneVerifiedState}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(val);
                        if (isPhoneVerifiedState) setIsPhoneVerifiedState(false);
                      }}
                      placeholder="98765 43210"
                      required
                      className={`block w-full rounded-md border-0 py-2 pl-12 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                        isPhoneVerifiedState 
                          ? "bg-gray-100 text-gray-600 ring-green-500 cursor-not-allowed" 
                          : "bg-white ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold"
                      } sm:text-sm sm:leading-6 transition-all`}
                    />
                  </div>

                  {!isPhoneVerifiedState && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || phone.replace(/\D/g, "").length < 10 || resendCountdown > 0}
                      className="px-4 py-2 bg-[#8B2C33] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#6e2329] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                    >
                      {isSendingOtp 
                        ? "Sending..." 
                        : resendCountdown > 0 
                        ? `Resend (${resendCountdown}s)` 
                        : isOtpSent 
                        ? "Resend OTP" 
                        : "Send OTP"}
                    </button>
                  )}
                </div>

                {/* OTP Input Section (Shows when OTP is sent & not yet verified) */}
                {isOtpSent && !isPhoneVerifiedState && (
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
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 tracking-widest font-mono text-center placeholder:tracking-normal placeholder:font-sans focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otp.trim().length !== 6}
                        className="px-4 py-2 bg-[#D1A254] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#b58b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                      >
                        {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address *
                </label>
                <div className="mt-1.5">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password *
                </label>
                <div className="mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmpassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Confirm password *
                </label>
                <div className="mt-1.5">
                  <input
                    id="confirmpassword"
                    name="confirmpassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    required
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-900">
                    Accept our terms and privacy policy
                  </label>
                </div>
              </div>

              <div>
                <CustomButton
                  buttonType="submit"
                  text="Create Account"
                  paddingX={3}
                  paddingY={2}
                  customWidth="full"
                  textSize="sm"
                />
              </div>
            </form>

            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-500">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  aria-label="Sign up with Google"
                  className="flex w-full items-center border border-gray-300 justify-center gap-2 rounded-md bg-white px-2 py-2 text-black hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors text-xs"
                  onClick={() => handleOAuthLogin("google")}
                >
                  <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.14 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="font-semibold">Google</span>
                </button>

                <button
                  type="button"
                  aria-label="Sign up with Apple"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-black px-2 py-2 text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors text-xs"
                  onClick={() => handleOAuthLogin("apple")}
                >
                  <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <span className="font-semibold">Apple</span>
                </button>

                <button
                  type="button"
                  aria-label="Sign up with Facebook"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1877F2] px-2 py-2 text-white hover:bg-[#166FE5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2] transition-colors text-xs"
                  onClick={() => handleOAuthLogin("facebook")}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Facebook</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-red-600 text-center text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
