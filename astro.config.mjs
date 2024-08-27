import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind({ applyBaseStyles: false }), alpinejs()],
	devToolbar: {
		enabled: false,
	},
	output: "server",
	server: {
		host: true,
	},
	adapter: node({
		mode: "standalone",
	}),
});
