"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "@/app/actions/profile.actions";
import { CustomButton } from "@/components";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ideally we would fetch this via a server component or server action
    // For simplicity we use a direct fetch to an API route, or we can use a server action.
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/customer/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-md w-full"></div>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-medium text-gray-900 mb-6">Profile Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">
              First name
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="firstName"
                id="firstName"
                defaultValue={profile?.firstName || ""}
                required
                className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-tanishq-gold sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">
              Last name
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="lastName"
                id="lastName"
                defaultValue={profile?.lastName || ""}
                required
                className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-tanishq-gold sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
              Phone Number
            </label>
            <div className="mt-2">
              <input
                type="tel"
                name="phone"
                id="phone"
                defaultValue={profile?.phone || ""}
                className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-tanishq-gold sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <CustomButton
            buttonType="submit"
            text={isSubmitting ? "Saving..." : "Save Changes"}
            paddingX={4}
            paddingY={2}
            customWidth="no"
            textSize="sm"
          />
        </div>
      </form>
    </div>
  );
}
