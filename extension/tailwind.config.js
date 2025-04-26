/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"

module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  plugins: [daisyui],
  daisyui: {
    themes: ["dark"]
  }
}
