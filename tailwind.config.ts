import type { Config } from "tailwindcss";

/**
 * Les couleurs pointent vers des variables CSS définies dans app/globals.css
 * (thèmes clair/sombre). Les modificateurs d'opacité Tailwind (ex: bg-primary/50)
 * ne fonctionnent pas sur ces tokens — utilisez les variantes -soft/-softer.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        hover: "var(--hover)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        primary: {
          DEFAULT: "var(--primary)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          soft: "var(--primary-soft)",
          softer: "var(--primary-softer)",
          fg: "var(--on-primary)",
        },
        sage: { DEFAULT: "var(--sage)", soft: "var(--sage-soft)" },
        coral: { DEFAULT: "var(--coral)", soft: "var(--coral-soft)" },
        gold: { DEFAULT: "var(--gold)", soft: "var(--gold-soft)" },
        amber: { DEFAULT: "var(--amber)", soft: "var(--amber-soft)" },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        xs: "var(--sh-xs)",
        sm: "var(--sh-sm)",
        md: "var(--sh-md)",
        lg: "var(--sh-lg)",
        primary: "var(--sh-primary)",
      },
      keyframes: {
        pop: { from: { opacity: "0", transform: "translateY(12px) scale(.97)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        pop: "pop .26s cubic-bezier(.16,1,.3,1)",
        fade: "fade .2s ease",
        slideIn: "slideIn .3s cubic-bezier(.16,1,.3,1)",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
