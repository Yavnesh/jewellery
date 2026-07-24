// *********************
// Role of the component: Premium newsletter signup section
// Name of the component: Newsletter.tsx
// *********************

import React from 'react'
import Image from 'next/image'
import { BRAND_NAME } from "@/utils/brand";

const Newsletter = () => {
  return (
    <div className="relative py-24 overflow-hidden">
      {/* Background image */}
      <Image
        src="/editorial-grid-2.png"
        alt="Join Vamika Jewels"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Warm overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2B0E0A]/90 via-[#2B0E0A]/75 to-[#2B0E0A]/60" />
      
      <div className="relative z-10 mx-auto max-w-screen-2xl px-16 max-md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left — brand text */}
        <div>
          <span className="text-tanishq-gold-light uppercase tracking-[0.3em] text-[10px] font-sans font-semibold">
            Stay Connected
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif font-light text-white uppercase tracking-wider mt-3 leading-tight">
            Join the {BRAND_NAME} Circle
          </h2>
          <div className="w-12 h-px bg-tanishq-gold-light/50 mt-5 mb-5" />
          <p className="text-sm text-stone-300 font-sans leading-relaxed max-w-md">
            Be the first to discover new collections, receive exclusive offers, and get invited to our private events. Join our community of jewelry connoisseurs.
          </p>
        </div>
        
        {/* Right — form */}
        <div>
          <form className="w-full max-w-lg">
            <div className="flex flex-col gap-4">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-tanishq-gold-light focus:ring-1 focus:ring-tanishq-gold-light/30 text-sm font-sans transition-all duration-300"
                placeholder="Enter your email address"
              />
              <button
                type="submit"
                className="bg-tanishq-gold-light text-tanishq-charcoal px-8 py-4 text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-white transition-all duration-300 shadow-lg"
              >
                Subscribe Now
              </button>
            </div>
            <p className="mt-4 text-[10px] leading-5 text-stone-400 font-sans">
              By subscribing, you agree to our{' '}
              <a href="#" className="font-semibold text-tanishq-gold-light/80 hover:text-tanishq-gold-light transition-colors">
                privacy&nbsp;policy
              </a>
              . Unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Newsletter