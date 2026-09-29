/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        nav: {
          bg: "#E5E2F7",
          active: "#1A1235",
          hover: "#D5D1F0",
          text: "#4A4A6A",
          textActive: "#E5E2F7",
        },
        sidebar: "#F5F3FF",
        card: {
          total: "#B4B8ED",
          issued: "#C5D7EE",
          overdue: "#E8A5A5",
          registrations: "#E5E5E5",
        },
        navy: {
          light: "#3D3772",
          DEFAULT: "#2A2155",
          dark: "#1A1235",
        },
        primary: "#1A1235",
        "primary-container": "#B4B8ED",
        "on-primary-container": "#1A1235",
        secondary: "#4A4A6A",
        "secondary-container": "#C5D7EE",
        "on-secondary-container": "#1A1235",
        tertiary: "#C75757",
        "tertiary-container": "#E8A5A5",
        "on-tertiary-container": "#1A1235",
        surface: "#F5F3FF",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#E5E5E5",
        "on-surface": "#2C2C3E",
        "on-surface-variant": "#6B6B85",
      },
      borderRadius: {
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
}
