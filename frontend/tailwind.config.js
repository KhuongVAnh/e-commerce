/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#2b3896",
        "primary-container": "#4551af",
        "surface": "#f9f9fc",
        "surface-container-highest": "#e2e2e5",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#454652",
      },
      fontFamily: {
        "headline": ["Be Vietnam Pro", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}