import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn primitives (HSL channels in globals.css)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // ASF brand palette — "MODERN ELITE"
        // Ferrari Red · Jet Black · Charcoal · Steel Gray · Platinum · White
        asf: {
          red: {
            DEFAULT: "#F00C0C",   // Ferrari Red (softened 4%)
            dark: "#C20000",
            light: "#FFE8E8",
          },
          // Names kept as `navy` so the entire codebase keeps working,
          // values point at Charcoal so the whole app re-skins for free.
          navy: {
            DEFAULT: "#1A1D21",   // Charcoal — main dark surface
            light: "#2A2D32",     // Hover state
            pale: "#F2F2F2",      // Platinum echo
          },
          black: "#0D0D0F",       // Jet Black — deepest scrim
          gold: {
            DEFAULT: "#8E949E",   // Steel Gray (was gold)
            light: "#F2F2F2",     // Platinum
          },
          green: {
            DEFAULT: "#00A85E",
            light: "#E6FAEF",
          },
          off: {
            DEFAULT: "#F2F2F2",   // Platinum — page background
            2: "#E5E7E9",
          },
          text: "#1A1D21",        // Charcoal
          muted: "#6B6F75",       // Lifted muted — WCAG AA pass
          "muted-soft": "#8E949E",// Steel Gray for non-text decoration
          border: "#E5E7E9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        condensed: ["var(--font-condensed)"],
        body: ["var(--font-body)"],
        sans: ["var(--font-body)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "fade-in": "fade-in 200ms ease-out",
        "fade-in-up": "fade-in-up 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
