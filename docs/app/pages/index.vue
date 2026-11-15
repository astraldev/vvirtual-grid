<script setup lang="ts">
definePageMeta({ header: false, footer: false });

const title = "Virtual grids for Vue 3";
const description =
  "A Vue 3 component that renders large lists as a CSS grid and keeps only the visible items in the DOM.";

useSeoMeta({ title, ogTitle: title, description, ogDescription: description });

const { github, socials } = useAppConfig();

const installCode = [
  "::code-group",
  ...[
    ["pnpm", "pnpm add vvirtual-grid"],
    ["npm", "npm install vvirtual-grid"],
    ["bun", "bun add vvirtual-grid"],
  ].map(([manager, command]) => `\`\`\`bash [${manager}]\n${command}\n\`\`\``),
  "::",
].join("\n");

const features = [
  {
    icon: "i-lucide-layout-grid",
    name: "Layout from your CSS",
    description:
      "Columns, gaps and item size come from grid-template-columns, gap and a probe element.",
    to: "/guides/sizing-and-direction",
  },
  {
    icon: "i-lucide-cloud-download",
    name: "Pages on demand",
    description:
      "The grid asks your pageProvider for the pages in view and shows placeholders until they arrive.",
    to: "/reference/utilities",
  },
  {
    icon: "i-lucide-crosshair",
    name: "Positions for every item",
    description:
      "Read the rectangle, row and column of any index, rendered or not, without allocating.",
    to: "/reference/primitives",
  },
  {
    icon: "i-lucide-accessibility",
    name: "ARIA in your hands",
    description:
      "The grid adds no roles. Set aria-setsize and aria-posinset from the slot's index.",
    to: "/guides/accessibility",
  },
];
</script>

<template>
  <UContainer class="flex min-h-dvh flex-col justify-center py-12">
    <div class="w-full lg:max-w-[60%]">
      <p class="text-sm font-medium text-primary">For Vue 3 and Nuxt</p>

      <h1
        class="mt-3 text-4xl font-bold tracking-tight text-pretty text-highlighted sm:text-5xl"
      >
        Virtual grids for <span class="text-primary">Vue</span>
      </h1>

      <p class="mt-6 text-lg text-pretty text-muted">
        Render a list of a million items as a CSS grid. Only the items in view,
        plus a buffer, are in the DOM.
      </p>

      <div class="mt-8 flex flex-wrap items-center gap-3">
        <UButton
          to="/getting-started/introduction"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        >
          Get started
        </UButton>
        <UButton
          :to="github.url"
          target="_blank"
          size="lg"
          color="neutral"
          variant="subtle"
          icon="i-simple-icons-github"
        >
          GitHub
        </UButton>
        <UButton
          :to="socials.npm"
          target="_blank"
          size="lg"
          color="neutral"
          variant="subtle"
          icon="i-simple-icons-npm"
        >
          npm
        </UButton>
      </div>

      <MDC :value="installCode" class="mt-6 max-w-md" />

      <ul class="mt-12 grid gap-4 sm:grid-cols-2">
        <li v-for="feature in features" :key="feature.name">
          <NuxtLink
            :to="feature.to"
            class="group flex h-full flex-col rounded-lg border border-default p-5 transition-colors hover:border-primary/50 hover:bg-elevated/50"
          >
            <UIcon
              :name="feature.icon"
              class="size-6 text-muted group-hover:text-primary"
            />
            <p class="mt-4 font-medium text-highlighted">{{ feature.name }}</p>
            <p class="mt-1 text-sm text-muted">{{ feature.description }}</p>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </UContainer>
</template>
