import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  clean: true,
  outDir: "dist",
  entries: [
    {
      input: "./src",
      builder: "mkdist",
      pattern: ["**/*.vue"],
      loaders: ["vue"],
    },
    {
      input: "./src",
      builder: "mkdist",
      pattern: ["**/*.ts"],
    },
    {
      builder: "mkdist",
      input: "./integrations/vue",
      outDir: "./dist/vue",
      pattern: ["**/*.vue"],
      loaders: ["vue"],
    },
    {
      builder: "mkdist",
      input: "./integrations/vue",
      outDir: "./dist/vue",
      pattern: ["**/*.ts"],
    },
    {
      builder: "mkdist",
      input: "./integrations/nuxt",
      outDir: "./dist/nuxt",
      pattern: ["**/*.ts"],
    },
  ],
  externals: ["vue", "rxjs", "ramda", "@vueuse/core", "@nuxt/kit"],
  rollup: {
    emitCJS: true,
  },
});
