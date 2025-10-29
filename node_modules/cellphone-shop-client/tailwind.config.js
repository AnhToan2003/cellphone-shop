/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "100%",
        md: "640px",
        lg: "960px",
        xl: "1140px",
      },
    },
    extend: {
      colors: {
        brand: {
          primary: "#E11D48",
          dark: "#be123c",
          light: "#f43f5e",
        },
        muted: "#f4f6fb",
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      boxShadow: {
        header: "0 10px 30px rgba(225, 29, 72, 0.18)",
        card: "0 18px 36px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
