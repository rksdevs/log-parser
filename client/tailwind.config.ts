// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // <-- ✅ ENSURE THIS LINE EXISTS
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@shadcn/ui/**/*.{js,ts,jsx,tsx}", // add this if using shadcn via lib mode
  ],
  theme: {
    extend: {},
  },
  plugins: [
  ],
  
};

export default config;
