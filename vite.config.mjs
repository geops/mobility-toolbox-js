import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
});
