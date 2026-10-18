import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

process.env.WRANGLER_WRITE_LOGS ??= "false";

export default defineConfig(async () => {
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    plugins: [react(), cloudflare()],
    server: { port: 3000 },
  };
});
