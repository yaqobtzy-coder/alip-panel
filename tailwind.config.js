/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      // "Warung Digital" — kios/toko malam
      colors: {
        ink: "#1A1512",
        panel: "#241C16",
        panel2: "#2D2318",
        line: "#43362A",
        accent: "#C1432E",
        accent2: "#C99A3E",
        warn: "#D98C2B",
        danger: "#8B3A2E",
        muted: "#9C8A73"
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sm: "6px",
        md: "10px"
      },
      // Timing yang selaras dengan Framer Motion (spring-ish feel via CSS)
      transitionTimingFunction: {
        motion: "cubic-bezier(0.22, 0.8, 0.22, 1)",
        spring: "cubic-bezier(0.34, 1.2, 0.64, 1)"
      },
      transitionDuration: {
        250: "250ms",
        280: "280ms",
        320: "320ms"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.28s cubic-bezier(0.22, 0.8, 0.22, 1) both",
        "fade-up": "fade-up 0.32s cubic-bezier(0.22, 0.8, 0.22, 1) both",
        "scale-in": "scale-in 0.28s cubic-bezier(0.22, 0.8, 0.22, 1) both"
      }
    }
  },
  plugins: []
};
