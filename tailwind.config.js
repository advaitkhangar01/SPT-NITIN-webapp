/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          blue: "#0F4C81",
          darkBlue: "#164E87",
          navy: "#0A335C",
          orange: "#F37021",
          orangeDark: "#D95D14",
          green: "#15803D",
          greenLight: "#E8F7EC",
          greenBorder: "#86EFAC",
          greyLight: "#F1F5F9",
          greyBorder: "#E2E8F0",
          textDark: "#1E293B",
          textMuted: "#475569",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
