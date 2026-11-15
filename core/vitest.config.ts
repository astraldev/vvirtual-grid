import { defineConfig, type ViteUserConfig } from "vitest/config";
import Vue from "unplugin-vue/vite";
import GithubActionsReporter from "vitest-github-actions-reporter";

// unplugin-vue is typed against another major of vite than vitest
type PluginOption = NonNullable<ViteUserConfig["plugins"]>[number];

export default defineConfig({
  // compiles Grid.vue for the component tests
  plugins: [Vue() as PluginOption],
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    benchmark: {
      reporters: ["default", new GithubActionsReporter()],
    },
  },
});
