import { defineNuxtModule, addComponent, createResolver } from "@nuxt/kit";

export interface ModuleOptions {}

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
  },
});
