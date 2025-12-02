/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'primary': '#6366f1',
        'primary-dark': '#4f46e5',
        'background': '#020617',
        'card': '#0f172a',
        'border': '#1e293b',
      }
    },
    fontFamily: {
      // Disable custom fonts to avoid React Native font errors
    }
  },
  plugins: [],
}
