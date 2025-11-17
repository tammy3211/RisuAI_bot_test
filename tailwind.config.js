/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./lib/**/*.{js,ts,jsx,tsx,svelte}",
    "./ts/**/*.{js,ts,jsx,tsx,svelte}",
  ],
  theme: {
    extend: {
      colors: {
        bgcolor: "var(--risu-theme-bgcolor)",
        darkbg: "var(--risu-theme-darkbg)",
        borderc: "var(--risu-theme-borderc)",
        selected: "var(--risu-theme-selected)",
        draculared: "var(--risu-theme-draculared)",
        textcolor: "var(--risu-theme-textcolor)",
        textcolor2: "var(--risu-theme-textcolor2)",
        darkborderc: "var(--risu-theme-darkborderc)",
        darkbutton: "var(--risu-theme-darkbutton)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}

