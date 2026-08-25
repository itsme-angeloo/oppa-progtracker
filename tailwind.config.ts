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
        "bg-void": "#0A0A0B",
        "bg-surface": "#111113",
        "bg-surface-raised": "#18181B",
        "border-subtle": "#27272A",
        "text-primary": "#F5F5F5",
        "text-muted": "#A1A1AA",
        "glow-cyan": "#F5F5F5",
        "glow-violet": "#FFFFFF",
        "glow-amber": "#D4D4D8",
        "glow-green": "#F5F5F5",
        "glow-red": "#A1A1AA",
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
