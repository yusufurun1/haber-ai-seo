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
        primary: {
          DEFAULT: "#10b981",
          hover: "#059669",
          light: "#d1fae5",
        },
        "ui-dark": "#0f172a",
        "bg-main": "#f8fafc",
        "bg-card": "#ffffff",
        "bg-alt": "#f1f5f9",
        "text-main": "#0f172a",
        "text-muted": "#64748b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Space Grotesk", "Inter", "sans-serif"],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
