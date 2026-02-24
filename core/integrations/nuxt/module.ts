import { defineNuxtModule, addComponent, createResolver } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";

const module: NuxtModule = defineNuxtModule({
  meta: {
    name: "vvirtual-grid",
    configKey: "vvgrid",
    compatibility: {
      nuxt: ">=3.0.0",
    },
  },
  defaults: {},
  setup() {
    const resolver = createResolver(import.meta.url);

    addComponent({
      name: "VirtualGrid",
      filePath: resolver.resolve("../../src/Grid.vue"),
    });
  },
});

export default module;
