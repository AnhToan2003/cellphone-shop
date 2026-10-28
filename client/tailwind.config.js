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
          primary: "#0F172A",
          dark: "#020617",
          light: "#1E293B",
          accent: "#2563EB",
          blue: "#2563EB",
          silver: "#E2E8F0",
          titanium: "#94A3B8",
          glow: "#38BDF8",
        },
        muted: "#F8FAFC",
        night: "#0B0F19",
        surface: "#0F172A",
        aurora: "#2563EB",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Be Vietnam Pro", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Sora", "Be Vietnam Pro", "sans-serif"],
      },
      boxShadow: {
        header: "0 4px 25px rgba(15, 23, 42, 0.18)",
        card: "0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        glass: "0 20px 40px -10px rgba(15, 23, 42, 0.12)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 50%), radial-gradient(circle at 80% 0%, rgba(37, 99, 235, 0.15), transparent 55%)",
        "mesh-pink":
          "radial-gradient(circle at 10% 20%, rgba(226, 232, 240, 0.6), transparent 45%), radial-gradient(circle at 80% 0%, rgba(241, 245, 249, 0.8), transparent 50%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulseSlow 8s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.25s ease-out both",
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
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
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
