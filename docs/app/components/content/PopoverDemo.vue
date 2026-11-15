<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";
import { getItemIndex, getItemViewportRect } from "vvirtual-grid/primitives";

const length = 10000;
const items = Array.from({ length }, (_, i) => `Item ${i}`);
const pageProvider = createPageProvider(items);

const grid = useTemplateRef<any>("grid");
const popover = useTemplateRef<HTMLElement>("popover");
const anchored = ref(-1);
const rectArgs = {
  root: null as Element | null,
  index: -1,
  layout: undefined as any,
  out: { x: 0, y: 0, width: 0, height: 0 },
};

function place() {
  if (anchored.value < 0 || !grid.value || !popover.value) return;
  rectArgs.root = grid.value.$el;
  rectArgs.index = anchored.value;
  rectArgs.layout = grid.value.measurement;
  if (!rectArgs.layout || !getItemViewportRect(rectArgs as any)) return;
  const { x, y, height } = rectArgs.out;
  popover.value.style.translate = `${x}px ${y + height + 4}px`;
}

function open(event: MouseEvent) {
  const index = getItemIndex({ root: grid.value.$el, target: event.target });
  if (index === -1 || !popover.value) return;
  anchored.value = index;
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
