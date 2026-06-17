import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "./app/**/*.{ts,tsx,mdx}",
    "./pages/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        neon: {
          purple: "#a855f7",
          cyan: "#06b6d4",
          pink: "#ec4899",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(168,85,247,.35)",
        "neon-strong": "0 0 40px rgba(168,85,247,.6)",
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(135deg, #1a002b 0%, #120033 40%, #070013 100%)",
        "app-radial":
          "radial-gradient(1200px 600px at 75% -10%, rgba(168,85,247,.15), transparent 60%)",
        "app-radial-2":
          "radial-gradient(800px 500px at 10% 110%, rgba(6,182,212,.12), transparent 60%)",
      },
      animation: {
        "bg-move": "bg-move 18s linear infinite",
        "slow-pulse": "slow-pulse 4s ease-in-out infinite",
      },
      keyframes: {
        "bg-move": {
          "0%": { transform: "translate3d(0,0,0) scale(1.02)" },
          "50%": { transform: "translate3d(-2%, -1%, 0) scale(1.03)" },
          "100%": { transform: "translate3d(0,0,0) scale(1.02)" },
        },
        "slow-pulse": {
          "0%, 100%": { opacity: ".65" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true, // avoids sticky hover on touch devices
  },
  plugins: [
    // Small helpers for state styling we used in ARIA-correct components
    plugin(({ addVariant }) => {
      addVariant("aria-selected", '&[aria-selected="true"]');
      addVariant("aria-pressed", '&[aria-pressed="true"]');
      addVariant("aria-disabled", '&[aria-disabled="true"]');
      addVariant("data-active", '&[data-active="true"]');
      addVariant("data-open", '&[data-state="open"]');
      addVariant("data-closed", '&[data-state="closed"]');
    }),
  ],
};

export default config;
