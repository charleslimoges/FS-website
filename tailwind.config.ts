import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        brand: {
          blue: "#2f3f81",
          navy: "#0a0e21",
        },
        gray: {
          50: "#f5f6fa",
          100: "#e8eaf0",
          200: "#d1d5e0",
          300: "#b0b7c9",
          400: "#8895b3",
          500: "#6b7a99",
          600: "#4a5568",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        seasons: ['"The Seasons"', "serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(47,63,129,0.08)",
        "card-hover": "0 8px 32px 0 rgba(47,63,129,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
