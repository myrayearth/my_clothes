import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccbfd',
          400: '#38b0fc',
          500: '#1a91f0', // Brand Logo primary sky/electric blue
          600: '#0c73d4',
          700: '#0b5cb0',
          800: '#0e4e90',
          900: '#114275',
          950: '#0b2a4d', // Brand Logo deep navy
        },
      },
    },
  },
  plugins: [],
};
export default config;
