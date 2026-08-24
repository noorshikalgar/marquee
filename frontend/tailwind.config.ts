import type { Config } from "tailwindcss";

function themed(name: string) {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: themed("base-950"),
          900: themed("base-900"),
          800: themed("base-800"),
          700: themed("base-700"),
        },
        slate: {
          50: themed("slate-50"),
          100: themed("slate-100"),
          200: themed("slate-200"),
          300: themed("slate-300"),
          400: themed("slate-400"),
          500: themed("slate-500"),
          600: themed("slate-600"),
        },
        amber: {
          300: themed("accent-300"),
          400: themed("accent-400"),
        },
        red: {
          400: themed("red-400"),
          950: themed("red-950"),
        },
        emerald: {
          400: themed("emerald-400"),
        },
        rose: {
          500: themed("rose-500"),
        },
        hairline: themed("hairline"),
        "accent-ink": "#0a0e17",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
