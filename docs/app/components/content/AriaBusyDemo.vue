<script setup lang="ts">
import { VirtualGrid } from "vvirtual-grid/vue";

const length = 10000;
const pageSize = 60;

// Resolves after 1.5 seconds, so placeholders stay visible while scrolling.
function pageProvider(page: number, size: number) {
  return new Promise<{ title: string }[]>((resolve) => {
    setTimeout(() => {
      const start = page * size;
      const count = Math.max(0, Math.min(size, length - start));
      resolve(
        Array.from({ length: count }, (_, i) => ({
          title: `Item ${start + i + 1}`,
        })),
      );
    }, 1500);
  });
}
</script>

<template>
  <div
    class="not-prose my-6 h-80 overflow-y-auto rounded-md border border-default p-2"
  >
    <VirtualGrid
      role="list"
      :length="length"
      :page-size="pageSize"
      :page-provider="pageProvider"
      class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
    >
      <template #default="{ item, index, style }">
        <div
          :style="style"
          :data-index="index"
          role="listitem"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="flex h-16 items-center justify-center rounded bg-elevated text-sm"
        >
          {{ item.title }}
        </div>
      </template>

      <template #placeholder="{ index, style }">
        <div
          :style="style"
          :data-index="index"
          role="listitem"
          aria-busy="true"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="h-16 animate-pulse rounded bg-muted"
        />
      </template>

      <template #probe>
        <div class="h-16" />
      </template>
    </VirtualGrid>
  </div>
</template>
