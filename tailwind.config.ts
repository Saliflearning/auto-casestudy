import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f1115",
        surface: "#15171d",
        panel: "#1b1f29",
        panelHigh: "#242a36",
        line: "#343b4c",
        ink: "#eef2ff",
        muted: "#a7afc3",
        faint: "#6f7890",
        primary: "#bfc7ff",
        primaryStrong: "#8287ff",
        violet: "#d6adff",
        amber: "#ffbd7a",
        emerald: "#6ee7b7",
        danger: "#ff9b9b",
        paper: "#f8fafc",
        slateInk: "#111827"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        editorial: ["Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 18px 60px -36px rgba(0,0,0,.8)",
        glow: "0 0 0 1px rgba(191,199,255,.2), 0 14px 40px -28px rgba(130,135,255,.9)"
      }
    }
  },
  plugins: []
};

export default config;
