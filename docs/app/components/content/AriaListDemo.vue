<script setup lang="ts">
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";

const length = 10000;
const items = Array.from({ length }, (_, i) => ({ title: `Item ${i + 1}` }));
const pageProvider = createPageProvider(items);
</script>

<template>
  <div
    class="not-prose my-6 h-80 overflow-y-auto rounded-md border border-default p-2"
  >
    <VirtualGrid
      role="list"
      :length="length"
      :page-size="60"
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
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="h-16 rounded bg-muted"
        />
      </template>

      <template #probe>
        <div class="h-16" />
      </template>
    </VirtualGrid>
  </div>
</template>
