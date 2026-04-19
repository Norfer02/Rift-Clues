import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rift: {
          night: "#0b1120",
          panel: "#101a2b",
          mist: "#cbd5e1",
          gold: "#f6c453",
          blue: "#2563eb",
          red: "#dc2626",
          neutral: "#475569",
          assassin: "#111827",
        },
      },
      boxShadow: {
        card: "0 18px 40px rgba(11, 17, 32, 0.18)",
      },
      backgroundImage: {
        "rift-glow":
          "radial-gradient(circle at top, rgba(246, 196, 83, 0.18), transparent 35%), linear-gradient(180deg, #08101d 0%, #0f172a 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
