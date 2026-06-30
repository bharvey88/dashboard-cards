import { defineConfig } from "vite";

// The bundle is shipped *inside* the integration, which serves it as a frontend
// module. Build straight into the integration's frontend directory.
export default defineConfig({
  build: {
    outDir: "custom_components/apollo_ld2410_tuning/frontend",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "apollo-dashboard-cards.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    minify: "terser",
  },
});
