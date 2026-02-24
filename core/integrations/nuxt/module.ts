import { defineNuxtModule, addComponent, createResolver, addVitePlugin } from "@nuxt/kit";

export interface ModuleOptions { }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "vvirtual-grid",
    configKey: "vvgrid",
    compatibility: {
      nuxt: ">=3.0.0",
    },
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    addComponent({
      name: "VirtualGrid",
      filePath: resolver.resolve("../../src/Grid.vue"),
    });

    addVitePlugin(() => ({
      name: '__optimize-deps',
      config(config) {
        config.optimizeDeps ||= {}
        config.optimizeDeps.include ||= []
        config.optimizeDeps.include.push(
          "ramda", "@vueuse/core", "rxjs",
        )
      },
    }))
  },
});
