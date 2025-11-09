/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#FFD700",
        night: "#0b0b0f",
        ink: "#111111",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.4)",
      },
    },
  },
  plugins: [],
}
