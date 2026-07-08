/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14121F",
        surface: "#FFFFFF",
        canvas: "#F7F6FB",
        line: "#EAE8F2",
        muted: "#8B87A0",
        primary: {
          DEFAULT: "#6E4CF0",
          dark: "#5A38DB",
          light: "#EFEAFE",
        },
        good: "#1FAE7A",
        warn: "#E0A526",
        bad: "#E15A5A",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 18, 31, 0.04), 0 8px 24px -12px rgba(20, 18, 31, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
