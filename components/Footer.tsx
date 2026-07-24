// *********************
// Role of the component: Footer component
// Name of the component: Footer.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Footer />
// Input parameters: no input parameters
// Output: Footer component
// *********************

import { navigation } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import { BRAND_NAME, BRAND_DESCRIPTION } from "@/utils/brand";

const Footer = () => {
  return (
    <footer className="bg-[#2B0E0A] border-t border-[#441913]" aria-labelledby="footer-heading">
      <div>
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 pt-20 pb-12">
          <div className="xl:grid xl:grid-cols-3 xl:gap-12">
            <div className="flex flex-col gap-y-4">
              <span className="text-xl font-serif font-semibold tracking-widest text-tanishq-gold-light uppercase">{BRAND_NAME}</span>
              <p className="text-sm text-stone-300 max-w-sm mt-2 font-sans leading-relaxed">
                {BRAND_DESCRIPTION}
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-sans font-semibold uppercase tracking-wider text-tanishq-gold-light">
                    Sale
                  </h3>
                  <ul role="list" className="mt-6 space-y-3">
                    {navigation.sale.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-sm text-stone-300 hover:text-tanishq-gold-light transition-colors duration-200"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-sans font-semibold uppercase tracking-wider text-tanishq-gold-light">
                    About Us
                  </h3>
                  <ul role="list" className="mt-6 space-y-3">
                    {navigation.about.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-sm text-stone-300 hover:text-tanishq-gold-light transition-colors duration-200"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-sans font-semibold uppercase tracking-wider text-tanishq-gold-light">
                    Buying
                  </h3>
                  <ul role="list" className="mt-6 space-y-3">
                    {navigation.buy.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-sm text-stone-300 hover:text-tanishq-gold-light transition-colors duration-200"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-sans font-semibold uppercase tracking-wider text-tanishq-gold-light">
                    Support
                  </h3>
                  <ul role="list" className="mt-6 space-y-3">
                    {navigation.help.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-sm text-stone-300 hover:text-tanishq-gold-light transition-colors duration-200"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-[#441913] pt-8 flex items-center justify-between text-xs text-stone-400 font-sans">
            <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
            <p className="tracking-widest uppercase">Designed for excellence</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
