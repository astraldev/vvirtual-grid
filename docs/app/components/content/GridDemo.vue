<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { VirtualGrid } from "vvirtual-grid/vue";

const length = 1_000_000;
const pageProvider = (page: number, pageSize: number) =>
  Array.from({ length: pageSize }, (_, i) => page * pageSize + i);

// how many item elements exist, to show that the count stays flat while scrolling
const grid = useTemplateRef<{ $el: Element }>("grid");
const rendered = ref(0);
function countRendered() {
  rendered.value = grid.value?.$el.querySelectorAll("[data-index]").length ?? 0;
}
</script>

<template>
  <div class="not-prose my-6">
    <div class="h-80 overflow-y-auto rounded-md border border-default p-2">
      <VirtualGrid
        ref="grid"
        :length="length"
        :page-size="60"
        :page-provider="pageProvider"
        class="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2"
        @render="countRendered"
      >
        <template #default="{ item, index, style }">
          <div
            :style="style"
            :data-index="index"
            class="flex h-14 items-center justify-center rounded bg-elevated font-mono text-xs text-muted"
          >
            {{ item }}
          </div>
        </template>

        <template #placeholder="{ index, style }">
          <div
            :style="style"
            :data-index="index"
            class="h-14 rounded bg-muted"
          />
        </template>

        <template #probe>
          <div class="h-14" />
        </template>
      </VirtualGrid>
    </div>
    <p class="mt-2 text-sm text-muted">
      {{ length.toLocaleString("en") }} items, {{ rendered }} elements in the
      DOM.
    </p>
  </div>
</template>
