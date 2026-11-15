export default defineNuxtConfig({
  css: ["~/assets/css/main.css"],
  // the landing page renders code blocks at runtime with <MDC>
  mdc: {
    highlight: {
      noApiRoute: false,
    },
  },
  site: {
    name: "Vue Virtual Grid",
    url: "https://vvirtual-grid.com",
  },
  seo: {
    meta: {
      description:
        "A Vue 3 component that renders large lists as a CSS grid and keeps only the visible items in the DOM.",
    },
  },
  content: {
    // node:sqlite ships with Node 22.5+, so no native addon has to compile
    experimental: { sqliteConnector: "native" },
  },
});
