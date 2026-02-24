import Aura from "@primeuix/themes/aura";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  ssr: true,

  modules: ["@primevue/nuxt-module", "vvirtual-grid/nuxt"],

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".app-dark",
        },
      },
    },
  },

  css: ["~/assets/main.css"],

  app: {
    head: {
      title: "VVirtualGrid — Demo",
      htmlAttrs: { class: "app-dark" },
    },
  },
});