import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-void": "#0A0E14",
        "bg-surface": "#12161F",
        "bg-surface-raised": "#1A1F2B",
        "border-subtle": "#232937",
        "text-primary": "#E8EBF2",
        "text-muted": "#7C8496",
        "glow-cyan": "#4DE8FF",
        "glow-violet": "#A78BFA",
        "glow-amber": "#FFB454",
        "glow-green": "#5EEAD4",
        "glow-red": "#FF6B7A",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
    },
  },
};

export default config;
