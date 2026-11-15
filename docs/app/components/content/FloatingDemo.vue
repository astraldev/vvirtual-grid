<script setup lang="ts">
import { onMounted, ref, shallowRef, useTemplateRef } from "vue";
import {
  flip,
  offset,
  shift,
  useFloating,
  type VirtualElement,
} from "@floating-ui/vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";
import { createRectQuery, getItemRect } from "vvirtual-grid/primitives";

const length = 10000;
const items = Array.from({ length }, (_, i) => `Item ${i}`);
const pageProvider = createPageProvider(items);

const grid = useTemplateRef<any>("grid");
const floating = useTemplateRef<HTMLElement>("floating");
const scroller = useTemplateRef<HTMLElement>("scroller");
const anchored = ref(-1);
const query = createRectQuery();

const reference = shallowRef<VirtualElement>({
  getBoundingClientRect() {
    query.root = grid.value.$el;
    query.index = anchored.value;
    query.layout = grid.value.measurement;
    getItemRect(query);
    return query.rect;
  },
});

const overflow: { boundary?: Element } = {};

onMounted(() => {
  overflow.boundary = scroller.value ?? undefined;
});

const { floatingStyles, update } = useFloating(reference, floating, {
  strategy: "fixed",
  placement: "bottom-start",
  middleware: [offset(4), flip(overflow), shift(overflow)],
});

function open(index: number) {
  anchored.value = index;
  floating.value?.showPopover();
  update();
}
</script>

<template>
  <div
    ref="scroller"
    class="not-prose my-6 h-80 overflow-y-auto rounded-md border border-default p-2"
  >
    <VirtualGrid
      ref="grid"
      role="list"
      :length="length"
      :page-size="60"
      :page-provider="pageProvider"
      class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
      @viewport-scroll="update"
      @layout-change="update"
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
          @click="open(index)"
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
      ref="floating"
      popover
      class="rounded-md border border-default bg-default px-3 py-2 text-sm shadow-lg"
      :style="floatingStyles"
      style="margin: 0; inset: auto"
    >
      Item {{ anchored }}, positioned by Floating UI
    </div>
  </div>
</template>
