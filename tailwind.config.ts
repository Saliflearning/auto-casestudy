import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#101214",
        surface: "#161a1d",
        panel: "#1d2328",
        panelHigh: "#273039",
        line: "#37414a",
        ink: "#f4f1e8",
        muted: "#b6b0a4",
        faint: "#7f887f",
        primary: "#a7d8c9",
        primaryStrong: "#5fbda4",
        violet: "#d8c7ff",
        amber: "#e9b872",
        emerald: "#7bd9ac",
        danger: "#e99595",
        paper: "#fbfaf6",
        slateInk: "#151816"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        editorial: ["Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 18px 48px -38px rgba(0,0,0,.78)",
        glow: "0 0 0 1px rgba(167,216,201,.18), 0 14px 38px -30px rgba(95,189,164,.55)"
      }
    }
  },
  plugins: []
};

export default config;
