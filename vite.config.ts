import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "apollo-radar-tuning.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    minify: "terser",
  },
});
