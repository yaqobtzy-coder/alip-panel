/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F17",
        panel: "#111827",
        panel2: "#161F2E",
        line: "#232E42",
        accent: "#5B8CFF",
        accent2: "#38D6A8",
        warn: "#F0B429",
        danger: "#EF5A5A",
        muted: "#7C8AA5"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sm: "6px",
        md: "10px"
      }
    }
  },
  plugins: []
};
