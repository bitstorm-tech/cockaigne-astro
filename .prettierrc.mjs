/** @type {import('prettier').Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  printWidth: 120,
  bracketSameLine: true,
  bracketSpacing: true,
  htmlWhitespaceSensitivity: "ignore",
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
