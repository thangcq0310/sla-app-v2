
/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mastercard-red': '#EB001B',
        'mastercard-yellow': '#F79E1B',
        'ink-black': '#141413',
        'signal-orange': '#CF4500',
        'light-signal-orange': '#F37338',
        'clay-brown': '#9A3A0A',
        'canvas-cream': '#F3F0EE',
        'lifted-cream': '#FCFBFA',
        'soft-bone': '#F4F4F4',
        'charcoal': '#262627',
        'slate-gray': '#696969',
        'granite': '#555555',
        'graphite': '#565656',
        'dust-taupe': '#D1CDC7',
        'link-blue': '#3860BE',
      },
      fontFamily: {
        sans: ['MarkForMC', 'SofiaSans', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '40px',
        'pill': '999px',
      },
      letterSpacing: {
        tighter: '-0.02em',
        tightest: '-0.03em',
      },
      spacing: {
        '18': '4.5rem',
      },
      boxShadow: {
        'soft-lift': '0px 4px 24px 0px rgba(0, 0, 0, 0.04)',
        'halo': '0px 24px 48px 0px rgba(0, 0, 0, 0.08)',
        'dramatic': '0px 70px 110px 0px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [
    plugin(function({ addBase, theme }) {
      addBase({
        'h1': { 
            fontSize: '64px', 
            fontWeight: '500',
            lineHeight: '64px',
            letterSpacing: '-1.28px',
        },
        'h2': { 
            fontSize: '36px', 
            fontWeight: '500',
            lineHeight: '44px',
            letterSpacing: '-0.72px',
        },
        'h3': { 
            fontSize: '24px', 
            fontWeight: '500',
            lineHeight: '1.2',
            letterSpacing: '-0.48px',
        },
        'p': {
            fontWeight: '450',
            lineHeight: '1.4',
        },
        // Add other base styles if necessary
      })
    })
  ],
}
