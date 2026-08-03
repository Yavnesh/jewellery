"use client";
import { CustomButton, SectionTitle } from "@/components";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    // Check if session expired
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      setError("Your session has expired. Please log in again.");
      toast.error("Your session has expired. Please log in again.");
    }
    
    // if user has already logged in redirect to home page
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router, searchParams]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const callbackUrl = searchParams.get('callbackUrl') || "/";

    if (!isValidEmailAddressFormat(email)) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Please check your email and password.");
      toast.error("Please check your email and password.");
      return;
    }

    // Generic error to not reveal if email exists
    const genericErrorMsg = "We couldn’t sign you in with those details.";

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(genericErrorMsg);
        toast.error(genericErrorMsg);
      } else {
        setError("");
        toast.success("Welcome back!");
        router.replace(callbackUrl);
      }
    } catch (err) {
      setError(genericErrorMsg);
      toast.error(genericErrorMsg);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    const callbackUrl = searchParams.get('callbackUrl') || "/";
    signIn(provider, { callbackUrl });
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
      <SectionTitle title="Login" path="Home | Login" />
      <div className="flex min-h-[70vh] flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-medium tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-tanishq-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-tanishq-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-3 block text-sm leading-6 text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <a
                    href="#"
                    className="font-semibold text-tanishq-gold hover:text-amber-700 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <CustomButton
                  buttonType="submit"
                  text="Sign in"
                  paddingX={3}
                  paddingY={2}
                  customWidth="full"
                  textSize="sm"
                />
              </div>
            </form>

            <div className="mt-10">
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  aria-label="Sign in with Google"
                  className="flex w-full items-center border border-gray-300 justify-center gap-3 rounded-md bg-white px-3 py-2 text-black hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors"
                  onClick={() => handleOAuthLogin("google")}
                >
                  <FcGoogle className="h-5 w-5" />
                  <span className="text-sm font-semibold leading-6">
                    Google
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Sign in with Apple"
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-black px-3 py-2 text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors"
                  onClick={() => handleOAuthLogin("apple")}
                >
                  <svg
                    className="h-5 w-5"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 384 512"
                  >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <span className="text-sm font-semibold leading-6">
                    Apple
                  </span>
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

export default LoginPage;
