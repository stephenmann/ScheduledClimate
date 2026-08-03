import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/scheduled-climate-card.ts"),
      formats: ["es"],
      fileName: () => "scheduled-climate-card.js",
    },
    outDir: resolve(__dirname, "../custom_components/scheduled_climate/frontend"),
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
  },
  test: {
    environment: "happy-dom",
  },
});
