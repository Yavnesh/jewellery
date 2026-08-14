"use client";

import React, { useState } from "react";
import { X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface WishlistPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistPopup = ({ isOpen, onClose }: WishlistPopupProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/login?email=${encodeURIComponent(email)}&callbackUrl=/shop`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Pane */}
            <div className="w-full md:w-1/2 bg-[#FCF6EB] p-10 flex flex-col items-center justify-center text-center border-r border-[#F3E5D0]">
              <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
                <Bell className="w-10 h-10 text-[#8B2C33]" />
              </div>
              
              <div className="bg-gradient-to-r from-transparent via-[#F1D5A6] to-transparent w-full py-1 mb-4">
                <h3 className="font-serif text-[#8B2C33] text-xl">Get Price Drop Alerts</h3>
              </div>
              
              <p className="font-serif text-[#9A7045] text-sm">
                Login to get alerts on your wishlist items
              </p>
            </div>

            {/* Right Pane */}
            <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-white">
              <h2 className="font-serif text-[#333333] text-2xl mb-2">
                Unlock Your Wishlist
              </h2>
              <p className="font-sans text-gray-500 text-sm mb-8">
                You're one step away from wishlisting your favorites
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <input 
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3 border border-gray-300 rounded-full outline-none text-sm font-sans placeholder-gray-400 focus:border-[#8B2C33] transition-colors bg-white shadow-sm"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-[#8B2C33] text-white px-6 py-3 font-sans text-sm font-semibold hover:bg-[#6e2329] transition-colors rounded-full shadow-sm tracking-wider"
                  >
                    Login to Continue
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-400 text-center font-sans mt-2">
                  By continuing, I agree to <a href="#" className="underline">Terms of Use</a> & <a href="#" className="underline">Privacy Notice</a>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
