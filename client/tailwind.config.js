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
          accent: "#ff8fab",
          glow: "#fda4af",
        },
        muted: "#f5f7ff",
        night: "#0B1220",
        surface: "#0f172a",
        aurora: "#3b82f6",
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "Inter", "Roboto", "system-ui", "sans-serif"],
        display: ["Sora", "Be Vietnam Pro", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        header: "0 14px 40px rgba(225, 29, 72, 0.2)",
        card: "0 20px 50px rgba(15, 23, 42, 0.08)",
        glass: "0 25px 65px rgba(15, 23, 42, 0.25)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.35), transparent 50%), radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.4), transparent 55%)",
        "mesh-pink":
          "radial-gradient(circle at 10% 20%, rgba(236, 72, 153, 0.25), transparent 35%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.35), transparent 50%), radial-gradient(circle at 50% 80%, rgba(248, 250, 252, 0.5), transparent 55%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulseSlow 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: 0.45 },
          "50%": { opacity: 1 },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      dropShadow: {
        glow: "0 25px 45px rgba(225, 29, 72, 0.35)",
      },
      transitionDuration: {
        400: "400ms",
      },
    },
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1440px",
    },
  },
  plugins: [],
};
