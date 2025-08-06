/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/globals.css"
  ],
  theme: {
    extend: {
      fontFamily: {
        fascinate: ["Fascinate", "cursive"],
      },
    },
  },
  plugins: [],
};
