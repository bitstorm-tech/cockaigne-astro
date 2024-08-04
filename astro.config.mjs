import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), alpinejs()],
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
