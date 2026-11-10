import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          cyan: "#00C2FF",
          dark: "#05070d",
          card: "#0c101c",
          border: "#182234",
        },
      },
      backgroundImage: {
        "solana-gradient": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
        "solana-gradient-subtle": "linear-gradient(135deg, rgba(153, 69, 255, 0.15) 0%, rgba(20, 241, 149, 0.15) 100%)",
        "solana-gradient-hover": "linear-gradient(135deg, #8735ea 0%, #10d482 100%)",
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(153, 69, 255, 0.25) 0%, rgba(20, 241, 149, 0.05) 50%, transparent 80%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(153, 69, 255, 0.3)" },
          "100%": { boxShadow: "0 0 25px rgba(20, 241, 149, 0.5)" },
        },
        shimmer: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
