import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base:    "#050510",
        surface: "#0A0A1E",
        card:    "#0E0E24",
        dim:     "#334155",
        snow:    "#F8FAFC",
        silver:  "#CBD5E1",
        slate:   "#64748B",
        indigo: { 300: "#A5B4FC", 400: "#818CF8", 500: "#6366F1", 600: "#4F46E5" },
        violet: { 400: "#A78BFA", 500: "#8B5CF6" },
        cyan:   { 400: "#22D3EE", 500: "#06B6D4" },
        emerald:{ 400: "#34D399", 500: "#10B981" },
        amber:  { 400: "#FBBF24" },
      },
      fontFamily: {
        // Body: DM Sans — clean, modern
        sans:    ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        // Display: Space Grotesk — geometric, premium SaaS
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.22), transparent 68%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 55%)",
      },
      animation: {
        // Long, cinematic
        "float-slow":    "floatSlow 7s ease-in-out infinite",
        "float-medium":  "floatMedium 5s ease-in-out infinite",
        "marquee-slow":  "marqueeX 32s linear infinite",
        "bg-shift":      "bgShift 20s ease infinite",
        "gradient-text": "gradientText 8s ease infinite",
        "pulse-slow":    "pulseSlow 3s ease-in-out infinite",
        "line-draw":     "lineDraw 1.8s ease forwards",
        "aurora-slow":   "auroraSlow 18s ease-in-out infinite",
        "shimmer-slow":  "shimmerSlow 3s linear infinite",
      },
      keyframes: {
        floatSlow: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-18px)" },
        },
        floatMedium: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%":     { transform: "translateY(-12px) rotate(1deg)" },
        },
        marqueeX: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        bgShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        gradientText: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        pulseSlow: {
          "0%,100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":     { opacity: "1",   transform: "scale(1.15)" },
        },
        lineDraw: {
          from: { transform: "scaleX(0)", opacity: "0" },
          to:   { transform: "scaleX(1)", opacity: "1" },
        },
        auroraSlow: {
          "0%,100%": { transform: "translate(0,0) scale(1) rotate(0deg)" },
          "25%":     { transform: "translate(60px,-45px) scale(1.15) rotate(5deg)" },
          "50%":     { transform: "translate(-40px,30px) scale(0.9) rotate(-3deg)" },
          "75%":     { transform: "translate(20px,-20px) scale(1.05) rotate(2deg)" },
        },
        shimmerSlow: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-indigo": "0 0 60px rgba(99,102,241,0.22), 0 0 120px rgba(99,102,241,0.1)",
        "glow-sm":     "0 0 20px rgba(99,102,241,0.18)",
        "card-float":  "0 24px 80px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.3)",
      },
      transitionTimingFunction: {
        // Expo-out: starts fast, slows dramatically — cinematic premium feel
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        // Apple-style spring-like
        "ios":      "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
