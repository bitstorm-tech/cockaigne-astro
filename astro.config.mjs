import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import vercelServerless from "@astrojs/vercel/serverless";
import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), alpinejs()],
  output: "server",
  adapter: vercelServerless()
});