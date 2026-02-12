import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "./integrations/nuxt/module.ts",
    "./integrations/vue/plugin.ts"
  ],
});