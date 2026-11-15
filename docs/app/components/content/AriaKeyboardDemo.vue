<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";
import {
  createCellQuery,
  getIndexByCell,
  getItemCell,
} from "vvirtual-grid/primitives";
import type { ItemLayout } from "vvirtual-grid/primitives";

const length = 10000;
const items = Array.from({ length }, (_, i) => ({ title: `Item ${i + 1}` }));
const pageProvider = createPageProvider(items);

const grid = useTemplateRef<{ $el: HTMLElement; measurement?: ItemLayout }>(
  "grid",
);
const focused = ref(0);
const cellQuery = createCellQuery();
let pendingFocus = false;

function onKeydown(event: KeyboardEvent) {
  const layout = grid.value?.measurement;
  if (!layout) return;

  cellQuery.layout = layout;
  cellQuery.index = focused.value;
  getItemCell(cellQuery);

  const { cell } = cellQuery;
  if (event.key === "ArrowDown") cell.row += 1;
  else if (event.key === "ArrowUp") cell.row -= 1;
  else if (event.key === "ArrowRight") cell.column += 1;
  else if (event.key === "ArrowLeft") cell.column -= 1;
  else return;

  if (cell.row < 0 || cell.column < 0 || cell.column >= layout.columns) return;
  const next = getIndexByCell(cellQuery);
  if (next < 0 || next >= length) return;

  event.preventDefault();
  moveTo(next);
}

function moveTo(index: number) {
  focused.value = index;
  pendingFocus = true;
  nextTick(focusFocused);
}

function focusFocused() {
  if (!pendingFocus) return;
  const element = grid.value?.$el.querySelector<HTMLElement>(
    `:scope > [data-index="${focused.value}"]`,
  );
  element?.focus({ preventScroll: true });
  if (element && document.activeElement === element) pendingFocus = false;
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
      :scroll-to="focused"
      scroll-behavior="auto"
      class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
      @keydown="onKeydown"
      @render="focusFocused"
    >
      <template #default="{ item, index, style }">
        <div
          :style="style"
          :data-index="index"
          role="listitem"
          :tabindex="index === focused ? 0 : -1"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          class="flex h-16 items-center justify-center rounded bg-elevated text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          class="h-16 rounded bg-muted"
        />
      </template>

      <template #probe>
        <div class="h-16" />
      </template>
    </VirtualGrid>
  </div>
</template>
