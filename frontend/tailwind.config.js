/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDarkest: "#080808",
        bgSecondary: "#111111",
        bgCard: "#171717",
        goldPrimary: "#F4C430",
        goldSecondary: "#E76F51",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        textPrimary: "#FFFFFF",
        textSecondary: "#A1A1AA",
        borderDark: "rgba(255,255,255,0.08)",
      },
      boxShadow: {
        goldGlow: "0 0 20px rgba(244, 196, 48, 0.15)",
        goldBorder: "0 0 10px rgba(244, 196, 48, 0.3)",
      }
    },
  },
  plugins: [],
}
