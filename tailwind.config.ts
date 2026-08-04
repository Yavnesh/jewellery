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
        'luxury-bg': '#FAF8F4',
        'luxury-card': '#FFFFFF',
        'luxury-section': '#F4EFE9',
        'luxury-text-primary': '#1D1D1D',
        'luxury-text-secondary': '#6B6B6B',
        'luxury-border': '#E6DED4',
        'luxury-gold': '#C9A96A',
        'luxury-gold-dark': '#9C7740',
        'luxury-success': '#198754',
        'luxury-sale': '#D62D20',
        'vamika-gold': '#9F7F53',
        'vamika-gold-light': '#C5A880',
        'vamika-charcoal': '#1C1B1A',
        'vamika-ivory': '#FAF8F5',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      }
    },
  },  
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms"), require("daisyui")],
};
export default config;
