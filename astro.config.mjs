import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import vercelServerless from "@astrojs/vercel/serverless";

export default defineConfig({
  integrations: [tailwind()],
  output: "server",
  adapter: vercelServerless(),
});

