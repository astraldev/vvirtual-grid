import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    pipeline: "./profiler-entry.ts",
  },
  outDir: "./",
  format: ["esm"],
  clean: false,
  minify: false,
  dts: false,
  sourcemap: true,
  external: ["rxjs", "ramda", "@vueuse/core"],
});
