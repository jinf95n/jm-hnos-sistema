/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jm: {
          blue: "#103f79",
          yellow: "#f3b229",
        }
      }
    },
  },
  plugins: [],
}