/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // ✅ enables OS-level dark mode
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F6EEDB', // 🌿 soft background
        sage: '#66754C',  // 🌿 your custom text/accent color
      },
    },
  },
  plugins: [
    require("daisyui"), // ✅ preserves DaisyUI support
  ],
};
