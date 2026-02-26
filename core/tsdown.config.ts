import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";
import Replace from "@rollup/plugin-replace";

export default defineConfig({
  publint: true,
  attw: {
    profile: "esm-only",
  },
  entry: [
    "./integrations/nuxt/module.ts",
    "./integrations/vue/index.ts",
    "./src/index.ts",
  ],
  format: ["esm"],
  minify: false,
  target: ["es2015"],
  platform: "neutral",
  dts: { vue: true },
  sourcemap: false,
  unbundle: true,
  clean: true,
  outDir: "dist",
  plugins: [
    Vue({ isProduction: true }),
    Replace({
      preventAssignment: true,
      include: ["**/integrations/nuxt/**"],
      values: { ".vue": ".js" },
      delimiters: ["", ""],
    }),
  ],
  external: [
    "vue",
    "@vueuse/core",
    "ramda",
    "rxjs",
    "@nuxt/kit",
    "@nuxt/schema",
  ],
});
