/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        dark: "#1b2123",
      },
    },
  },

  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "base-300": "#1b2123",
          "base-100": "#1b2123",
          primary: "#2c363a",
          warning: "#751b37",
        },
      },
    ],
  },
};
