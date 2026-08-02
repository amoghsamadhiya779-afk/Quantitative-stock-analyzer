/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "secondary": "#43e188",
        "on-primary-fixed": "#380d00",
        "surface-dim": "#131313",
        "inverse-surface": "#e2e2e2",
        "on-secondary-fixed-variant": "#00522b",
        "on-surface": "#e2e2e2",
        "on-surface-variant": "#ddc1b7",
        "on-error-container": "#ffdad6",
        "error-container": "#93000a",
        "on-tertiary": "#670211",
        "secondary-fixed-dim": "#43e188",
        "primary": "#ffb59a",
        "outline": "#a48b83",
        "primary-fixed-dim": "#ffb59a",
        "surface-container": "#1f1f1f",
        "tertiary-fixed": "#ffdad8",
        "surface-container-low": "#1b1b1b",
        "on-tertiary-fixed-variant": "#881d24",
        "on-secondary-container": "#004825",
        "surface-tint": "#ffb59a",
        "inverse-on-surface": "#303030",
        "secondary-fixed": "#66fea2",
        "secondary-container": "#02c16d",
        "on-secondary-fixed": "#00210e",
        "tertiary": "#ffb3b0",
        "surface": "#131313",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "inverse-primary": "#9e421b",
        "tertiary-container": "#ee696a",
        "on-primary-container": "#541800",
        "on-background": "#e2e2e2",
        "on-primary": "#5b1b00",
        "surface-container-highest": "#353535",
        "on-primary-fixed-variant": "#7f2b04",
        "surface-bright": "#393939",
        "on-secondary": "#00391c",
        "on-tertiary-container": "#60000e",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-fixed": "#410006",
        "surface-variant": "#353535",
        "surface-container-lowest": "#0e0e0e",
        "background": "#131313",
        "outline-variant": "#56423b",
        "primary-fixed": "#ffdbcf",
        "tertiary-fixed-dim": "#ffb3b0",
        "primary-container": "#e2754a"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        // "full" was previously overridden to 0.75rem (12px) instead of a true circular
        // radius. That's invisible on small elements (status dots clamp to half their own
        // size regardless) but visibly wrong on anything larger - e.g. w-8 h-8 avatar
        // circles and loading spinners rendered as rounded squares instead of circles.
        // Omitting the key here restores Tailwind's real default (9999px).
      },
      spacing: {
        "stack-sm": "8px",
        "stack-xl": "64px",
        "gutter": "24px",
        "stack-md": "16px",
        "unit": "4px",
        "margin-desktop": "48px",
        "margin-mobile": "16px",
        "stack-lg": "32px",
        "stack-xs": "4px"
      },
      fontFamily: {
        "display-md": ["var(--font-playfair)", "Playfair Display", "serif"],
        "label-sm": ["var(--font-inter)", "Inter", "sans-serif"],
        "headline-lg": ["var(--font-inter)", "Inter", "sans-serif"],
        "headline-md": ["var(--font-inter)", "Inter", "sans-serif"],
        "display-lg": ["var(--font-playfair)", "Playfair Display", "serif"],
        "body-md": ["var(--font-inter)", "Inter", "sans-serif"],
        "data-table": ["var(--font-inter)", "Inter", "sans-serif"],
        "display-lg-mobile": ["var(--font-playfair)", "Playfair Display", "serif"],
        "body-lg": ["var(--font-inter)", "Inter", "sans-serif"]
      },
      fontSize: {
        "display-md": ["36px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-lg": ["88px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "data-table": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "display-lg-mobile": ["48px", { lineHeight: "1.2", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }]
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
module.exports = config;
