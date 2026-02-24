import type { Plugin } from "vue";
import Grid from "../../src/Grid.vue";

export const VVirtualGridPlugin: Plugin = {
  install(app) {
    app.component("VVirtualGrid", Grid);
  },
};
