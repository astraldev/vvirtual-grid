<script setup lang="ts">
import { ref } from "vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";

const length = 10000;
const items = Array.from({ length }, (_, i) => ({ title: `Option ${i + 1}` }));
const pageProvider = createPageProvider(items);
const selected = ref(-1);

function select(event: MouseEvent) {
  const option = (event.target as Element).closest<HTMLElement>("[data-index]");
  if (option) selected.value = Number(option.dataset.index);
}
</script>

<template>
  <div
    class="not-prose my-6 h-80 overflow-y-auto rounded-md border border-default p-2"
  >
    <VirtualGrid
      role="listbox"
      aria-label="Options"
      :length="length"
      :page-size="60"
      :page-provider="pageProvider"
      class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
      @click="select"
    >
      <template #default="{ item, index, style }">
        <div
          :style="style"
          :data-index="index"
          role="option"
          :aria-selected="index === selected"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="flex h-16 cursor-pointer items-center justify-center rounded bg-elevated text-sm hover:bg-accented"
          :class="index === selected ? 'ring-2 ring-primary' : ''"
        >
          {{ item.title }}
        </div>
      </template>

      <template #placeholder="{ index, style }">
        <div
          :style="style"
          :data-index="index"
          role="option"
          :aria-selected="false"
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
