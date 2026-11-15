<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";
import { createRectQuery, getItemRect } from "vvirtual-grid/primitives";

const length = 10000;
const items = Array.from({ length }, (_, i) => `Item ${i}`);
const pageProvider = createPageProvider(items);

const grid = useTemplateRef<any>("grid");
const popover = useTemplateRef<HTMLElement>("popover");
const anchored = ref(-1);
const query = createRectQuery();

function place() {
  if (anchored.value < 0 || !grid.value || !popover.value) return;
  query.root = grid.value.$el;
  query.index = anchored.value;
  query.layout = grid.value.measurement;
  if (!getItemRect(query)) return;
  popover.value.style.translate = `${query.rect.left}px ${query.rect.bottom + 4}px`;
}

function open(event: MouseEvent) {
  const item = (event.target as Element).closest<HTMLElement>("[data-index]");
  if (!item || !popover.value) return;
  anchored.value = Number(item.dataset.index);
  place();
  popover.value.showPopover();
}
</script>

<template>
  <div
    class="not-prose my-6 h-80 overflow-y-auto rounded-md border border-default p-2"
  >
    <VirtualGrid
      ref="grid"
      role="list"
      :length="length"
      :page-size="60"
      :page-provider="pageProvider"
      class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
      @click="open"
      @viewport-scroll="place"
      @layout-change="place"
    >
      <template #default="{ item, index, style }">
        <button
          type="button"
          :style="style"
          :data-index="index"
          role="listitem"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="h-16 rounded bg-elevated text-sm hover:bg-accented"
          :class="index === anchored ? 'ring-2 ring-primary' : ''"
        >
          {{ item }}
        </button>
      </template>

      <template #placeholder="{ index, style }">
        <div :style="style" :data-index="index" class="h-16 rounded bg-muted" />
      </template>

      <template #probe>
        <div class="h-16" />
      </template>
    </VirtualGrid>

    <div
      ref="popover"
      popover
      class="rounded-md border border-default bg-default px-3 py-2 text-sm shadow-lg"
      style="position: fixed; inset: 0 auto auto 0; margin: 0"
    >
      Item {{ anchored }}, anchored by index
    </div>
  </div>
</template>
