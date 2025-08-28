import type { Config } from "tailwindcss";

export default {
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
        green: "var(--green)",
        grey: "var(--grey)",
        lghtgrey: "var(--lghtgrey)",
        amber: "var(--amber)",
      },
      boxShadow: {
        solid: '4px 4px 0px rgba(0, 0, 0, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
