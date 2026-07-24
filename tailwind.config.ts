import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-yellow': '#FED700',
        'luxury-bg': '#FFFFFF',
        'luxury-ivory': '#FAF8F5',
        'luxury-sidebar': '#F9F9F9',
        'luxury-text-primary': '#111111',
        'luxury-text-secondary': '#666666',
        'luxury-border': '#ECECEC',
        'luxury-gold': '#D4AF37',
        'tanishq-gold': '#9F7F53',
        'tanishq-gold-light': '#C5A880',
        'tanishq-charcoal': '#1C1B1A',
        'tanishq-ivory': '#FAF8F5',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      }
    },
  },  
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms"), require("daisyui")],
};
export default config;
