/** @type {import('prettier').Config} */
export default {
	plugins: [
		"prettier-plugin-tailwindcss",
		"prettier-plugin-astro",
		"prettier-plugin-organize-imports",
		"prettier-plugin-astro-organize-imports",
	],
	useTabs: true,
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
