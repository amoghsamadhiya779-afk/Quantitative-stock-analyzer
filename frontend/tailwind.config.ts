import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        accent: "var(--accent)",
        profit: "var(--profit)",
        loss: "var(--loss)",
        "signal-orange": "var(--color-signal-orange)",
        "sienna-bronze": "var(--color-sienna-bronze)",
        carbon: "var(--color-carbon)",
        graphite: "var(--color-graphite)",
        slate: "var(--color-slate)",
        fog: "var(--color-fog)",
        mist: "var(--color-mist)",
        chalk: "var(--color-chalk)",
        paper: "var(--color-paper)",
      },
      borderRadius: {
        card: "var(--radius-cards)",
        button: "var(--radius-buttons)",
        nav: "var(--radius-navpill)",
        input: "var(--radius-inputs)",
        tag: "var(--radius-tags)",
        '24': '24px',
        '32': '32px',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.5" }],
        body: ["16px", { lineHeight: "1.38" }],
        "body-lg": ["18px", { lineHeight: "1.33" }],
        subheading: ["32px", { lineHeight: "1.19", letterSpacing: "-0.64px" }],
        heading: ["40px", { lineHeight: "1.13", letterSpacing: "-0.8px" }],
        "display-lg": ["66px", { lineHeight: "0.91", letterSpacing: "-1.32px" }],
      },
      spacing: {
        "8v": "8px",
        "12v": "12px",
        "16v": "16px",
        "20v": "20px",
        "36v": "36px",
        "40v": "40px",
        "60v": "60px",
        "140v": "140px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(32, 32, 32, 0.04), 0 4px 12px rgba(32, 32, 32, 0.03)",
        "card-hover": "0 2px 6px rgba(32, 32, 32, 0.06), 0 6px 16px rgba(32, 32, 32, 0.04)",
      },
      maxWidth: {
        page: "1200px",
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
