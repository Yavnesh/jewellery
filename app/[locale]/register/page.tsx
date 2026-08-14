"use client";
import { CustomButton, SectionTitle } from "@/components";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    // chechking if user has already registered redirect to home page
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
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
        body: JSON.stringify({ email, password, name, lastname }),
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
          // Do not reveal email existence explicitly, just say generic or "Account may already exist"
          setError("We couldn't create an account with those details.");
          toast.error("We couldn't create an account with those details.");
        } else {
          setError(genericErrorMsg);
          toast.error(genericErrorMsg);
        }
      }
    } catch (error) {
      setError(genericErrorMsg);
      toast.error(genericErrorMsg);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    // Redirecting directly via NextAuth for OAuth
    // (signIn automatically handles creation if user doesn't exist)
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

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    First Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium leading-6 text-gray-900">
                    Last Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmpassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Confirm password
                </label>
                <div className="mt-2">
                  <input
                    id="confirmpassword"
                    name="confirmpassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-vamika-gold sm:text-sm sm:leading-6 transition-shadow"
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

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  aria-label="Sign up with Google"
                  className="flex w-full items-center border border-gray-300 justify-center gap-3 rounded-md bg-white px-3 py-2 text-black hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors"
                  onClick={() => handleOAuthLogin("google")}
                >
                  <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.14 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="text-sm font-semibold leading-6">
                    Google
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Sign up with Apple"
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-black px-3 py-2 text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors"
                  onClick={() => handleOAuthLogin("apple")}
                >
                  <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 384 512">
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

export default RegisterPage;
