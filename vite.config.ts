import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "apollo-dashboard-cards.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    minify: "terser",
  },
});
