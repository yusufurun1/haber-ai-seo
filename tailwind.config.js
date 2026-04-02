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
          DEFAULT: "#1fd176",
          hover: "#19b363",
        },
        "ui-dark": "#1e2433",
        "bg-main": "#ffffff",
        "bg-alt": "#f8fbfc",
        "text-main": "#1e2433",
        "text-muted": "#64748b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
};
