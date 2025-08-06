/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/app/globals.css",
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
