# vvirtual-grid

A Vue 3 component that renders a large list as a CSS grid and keeps only the
items near the viewport in the page. A list of 1,000,000 items keeps about the
same number of elements as a list of 1,000.

- [Documentation](https://vvirtual-grid.netlify.app)
- [NPM Package][npm]

## Scope

`vvirtual-grid` handles over a million items. The
[benchmarks](https://github.com/astraldev/vvirtual-grid/tree/main/benchmarks)
render 1,000,000 items in one grid, and the page holds about 200 item elements
at a time.

It is a performant grid and nothing else. It is not a replacement for a
general-purpose virtualizer such as [TanStack Virtual](https://tanstack.com/virtual)
or `vue-virtual-scroller`, which also handle lists, tables and dynamic content.
It renders grids of equally sized items, so items whose size depends on their
content are not supported. Use one of those libraries if you need that.

## Features

- Use virtual scrolling to render the items, so the number of DOM nodes stays
  low.
- Style the grid with CSS grid. The library sets the item positions and the
  grid's content size, and leaves colors, borders and fonts to your CSS.
- Support using a paginated API to load the items in the background.
- Support rendering placeholders for unloaded items.
- Support both vertical and horizontal scroll.
- Cache loaded pages, so a page is requested once.

## Performance

Version 1.2.0 against 1.1.6, on a list of 1,000,000 items, on the same machine.

| Benchmark                         | 1.1.6    | 1.2.0    | Time saved | Speed-up     |
| --------------------------------- | -------- | -------- | ---------- | ------------ |
| 20 scroll events, one row each    | 1,530 ms | 0.40 ms  | 99.97%     | 3,800 times  |
| 20 scroll events, 2px each        | 0.017 ms | 0.004 ms | 76%        | 4 times      |
| Starting the grid                 | 44 ms    | 0.82 ms  | 98%        | 54 times     |

The [benchmarks page](https://vvirtual-grid.netlify.app/reference/benchmarks) has the full
tables and how to run them.

## Install

```shell
npm install vvirtual-grid
```

## Usage

### Vue

Import and use the `VirtualGrid` component directly:

```vue
<script setup>
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";

const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
const pageProvider = createPageProvider(items);
</script>

<template>
  <div class="scroller">
    <VirtualGrid
      class="grid"
      :length="items.length"
      :page-size="40"
      :page-provider="pageProvider"
    >
      <template v-slot:default="{ item, style, index }">
        <div :style="style" class="item">{{ item }} {{ index }}</div>
      </template>
      <template v-slot:placeholder="{ index, style }">
        <div :style="style" class="item">Placeholder {{ index }}</div>
      </template>
      <template v-slot:probe>
        <div class="item" />
      </template>
    </VirtualGrid>
  </div>
</template>
```

The grid takes its scroll position from the nearest ancestor that scrolls. Put
it inside a container with a height and `overflow-y: auto`. The grid is a CSS
grid, and the probe has the size of one item:

```css
.scroller {
  height: 24rem;
  overflow-y: auto;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.item {
  height: 6rem;
}
```

Or register it globally as a plugin:

```js
// main.js
import { createApp } from "vue";
import { VVirtualGridPlugin } from "vvirtual-grid/vue";
import App from "./App.vue";

createApp(App).use(VVirtualGridPlugin).mount("#app");
```

### Nuxt

Add `vvirtual-grid/nuxt` to the `modules` array in your `nuxt.config.ts`.
The `<VirtualGrid>` component will be auto-imported globally.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["vvirtual-grid/nuxt"],
});
```

## Available Props

| Name                       | Description                                                                      | Type                                                     | Validation                                                       |
| -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `length`                   | The number of items in the list                                                  | `number`                                                 | Required, an integer greater than or equal to 0                  |
| `pageProvider`             | The callback that returns the items of one page, as an array or a promise. `pageNumber` starts at 0 | `(pageNumber: number, pageSize: number) => Promise<T[]> \| T[]` | Required                                                         |
| `pageSize`                 | The number of items in a page from the item provider (e.g. a backend API)        | `number`                                                 | Required, an integer greater than or equal to 1                  |
| `pageProviderDebounceTime` | For a network provider, set this first. Milliseconds to wait before calling `pageProvider`. Pages skipped meanwhile are never requested | `number`                                                 | Optional, an integer greater than or equal to 0, defaults to `0` |
| `probeTag`                 | The HTML tag used as probe element                                               | `string`                                                 | Optional, any valid HTML tag, defaults to `div`                  |
| `getItemId`                | Returns a unique, stable identifier of an item. Items with the same identifier are not rendered again when their page is loaded again | `(item: T) => string` &#124; `number` | Optional |
| `respectScrollToOnResize`  | Snap to the position set by `scrollTo` when the grid container is resized        | `boolean`                                                | Optional, defaults to `true`                                     |
| `scrollBehavior`           | The behavior of `scrollTo`                                                       | `"smooth"` &#124; `"auto"`                               | Optional, defaults to `"smooth"`                                 |
| `scrollTo`                 | Scroll to a specific item by index                                               | `number`                                                 | Optional, an integer from 0 to `length - 1`                      |
| `tag`                      | The HTML tag used as container element                                           | `string`                                                 | Optional, any valid HTML tag, defaults to `div`                  |
| `getKey`                   | The `:key` used on each grid item. Auto-generated, but overridable via function  | `(internalItem: InternalItem) => number \| string`       | Optional                                                         |

## Available Slots

There are two scoped slots, `default` and `placeholder`, and a `probe` slot with
no props.

### The `default` slot

The `default` slot is used to render a loaded item.

Props:

- `item`: the loaded item used for rendering your element/component.
- `index`: the index of the current item within the list.
- `style`: the style object provided by the library that must be set on the
  item element/component.

Example:

```vue
<template v-slot:default="{ item, style, index }">
  <div :style="style">{{ item }} {{ index }}</div>
</template>
```

### The `placeholder` slot

When an item is not yet loaded, the component/element in the `placeholder` slot
will be used for rendering. The `placeholder` slot is optional. If missing, the
space of unloaded items will be blank until they are loaded.

Props:

- `index`: the index of the current item within the list.
- `style`: the style object provided by the library that must be set on the
  item element/component.

Example:

```vue
<template v-slot:placeholder="{ index, style }">
  <div :style="style">Placeholder {{ index }}</div>
</template>
```

### The `probe` slot

The `probe` slot is used to measure the visual size of a grid item. It has no
props. You can reuse the same element/component as the `placeholder` slot.

Give the probe the same size as the items in the `default` and `placeholder`
slots. The grid places every item as if it had the probe's size, so a taller item
overlaps the next row and a shorter one leaves a gap.

Without a `probe` slot, set the row height on the grid with `grid-template-rows`
or `grid-auto-rows`, for example `200px`.

Example:

```vue
<template v-slot:probe>
  <div class="item">Probe</div>
</template>
```

## Exposed Public Properties

| Name          | Type                                  | Description                                                                                                                           |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`       | `Ref<boolean>`                        | `true` after the first measurement                                                                                                    |
| `measurement` | `Ref<ResizeMeasurement \| undefined>` | The measurement the items are positioned with: `flow`, `columns`, `rows`, `colGap`, `rowGap`, `itemWidthWithGap`, `itemHeightWithGap` |

## Events

The grid emits three events. None of them carries a payload.
The sample uses the grid from [Vue](#vue).

| Event             | Emitted                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `render`          | After the set of rendered items changed and the DOM was patched                                |
| `viewport-scroll` | When a scroll parent of the grid scrolls, so every item moved on screen. Fires on every scroll |
| `layout-change`   | After the grid measured itself again (item size, gap, tracks or flow changed)                  |

```vue
<template>
  <div class="scroller">
    <VirtualGrid
      class="grid"
      :length="1000"
      :page-provider="pageProvider"
      :page-size="40"
      @render="onRender"
      @viewport-scroll="onViewportScroll"
      @layout-change="onLayoutChange"
    >
      <!-- slots -->
    </VirtualGrid>
  </div>
</template>
```

## Low-level Primitives

The [primitives reference](https://vvirtual-grid.netlify.app/reference/primitives) and the
[popovers guide](https://vvirtual-grid.netlify.app/guides/popovers) cover this section in
full.

The grid does not add ARIA roles, focus handling or overlays. Instead, it gives
you the positions it already computes, so you can build them yourself. Use the
primitives to get an item's rectangle, or its row and column, even when the item
is not rendered.

The primitives are plain functions in `vvirtual-grid/primitives`. Each one
reads and writes a query object that you create once and reuse. You set
`index` (and `layout`, `root`) before each call, and the result is written into
the object's `rect` or `cell`. `viewport-scroll` fires on every scroll event, and
a new object per event is garbage the browser must collect while the user
scrolls. The idea is the same as an output parameter in a C API,
`get_rect(index, &rect)`.

| Function                                                  | Description                                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createRectQuery({ index?, layout?, root? }): RectQuery`  | Creates the reusable query for `getItemRect`. The result goes into `query.rect`.                                                            |
| `getItemRect(query): boolean`                             | The item's rectangle, rendered or not. With `root: null` it is relative to item 0. With `root` set to the grid element, relative to the viewport, like `getBoundingClientRect()`. `false` when `layout` is `undefined` or nothing is rendered. |
| `createCellQuery({ index?, layout? }): CellQuery`         | Creates the reusable query for `getItemCell` and `getIndexByCell`. The result goes into `query.cell`.                                      |
| `getItemCell(query): boolean`                             | Writes the zero-based visual `row` and `column` of `query.index` into `query.cell`. `false` without `layout`.                              |
| `getIndexByCell(query): number`                           | The index at `query.cell`. `-1` without `layout`.                                                                                           |
| `createItemTracker({ onBind, onUnbind }): (root) => void` | Returns a function that reports what started and stopped rendering since its last call. Call it with the grid element on `render`.         |

- `root` is the grid element, `grid.value.$el` when your template ref is named
  `grid`.
- `layout` is the `measurement` exposed by the grid (see
  [Exposed Public Properties](#exposed-public-properties)). It is `undefined`
  until the grid is measured.
- `rect` has the fields of a `DOMRect`, so it can be returned from a Floating
  UI virtual element's `getBoundingClientRect()`.

To find elements, set `:data-index="index"` on the root element of your
`default` and `placeholder` slots. Then use the DOM:

```js
// the element rendering item 42, or null
const element = root.querySelector(':scope > [data-index="42"]');
// the index of the item an event came from, or -1
const index = Number(event.target.closest("[data-index]")?.dataset.index ?? -1);
// the number of rows in row flow
const rowCount = Math.ceil(length / measurement.columns);
```

### Example: ARIA attributes and a native popover

Everything below is userland code. The items are a flat list of elements, so
the `list` / `listitem` roles with `aria-setsize` / `aria-posinset` describe
them correctly even though most of them are not in the DOM. (`role="grid"`
needs `row` elements between the grid and its cells, which a flat list does
not have. `getItemCell` gives you the numbers for `aria-rowindex` if you render
such a structure yourself.)

<details>
<summary>Show the full component</summary>

```vue
<script setup>
import { ref, useTemplateRef } from "vue";
import { VirtualGrid, createPageProvider } from "vvirtual-grid/vue";
import { createRectQuery, getItemRect } from "vvirtual-grid/primitives";

const length = 10000;
const items = Array.from({ length }, (_, i) => `Item ${i}`);
const pageProvider = createPageProvider(items);
const grid = useTemplateRef("grid");
const popover = useTemplateRef("popover");
const anchored = ref(-1); // the index the popover is bound to
const query = createRectQuery();

function place() {
  if (anchored.value < 0 || !grid.value.measurement) return;
  query.root = grid.value.$el;
  query.index = anchored.value;
  query.layout = grid.value.measurement;
  // works even while the item is scrolled out and not rendered
  if (!getItemRect(query)) return;
  const { x, y, height } = query.rect;
  popover.value.style.left = x + "px";
  popover.value.style.top = y + height + "px";
}

function show(event) {
  const index = Number(event.target.closest("[data-index]")?.dataset.index ?? -1);
  if (index === -1) return;
  anchored.value = index;
  place();
  popover.value.showPopover();
}
</script>

<template>
  <div style="height: 24rem; overflow-y: auto">
    <VirtualGrid
      ref="grid"
      role="list"
      :length="length"
      :page-provider="pageProvider"
      :page-size="40"
      class="grid grid-cols-[repeat(4,1fr)] gap-4"
      @click="show"
      @viewport-scroll="place"
      @layout-change="place"
    >
      <template #default="{ item, style, index }">
        <div
          :style="style"
          :data-index="index"
          role="listitem"
          :aria-setsize="length"
          :aria-posinset="index + 1"
          style="height: 6rem"
        >
          {{ item }}
        </div>
      </template>

      <template #probe>
        <div style="height: 6rem" />
      </template>
    </VirtualGrid>
  </div>

  <div ref="popover" popover style="position: fixed; inset: 0 auto auto 0; margin: 0">
    Item {{ anchored }}
  </div>
</template>
```

</details>

Where [CSS anchor positioning][anchor] is supported you can skip `place()`
while the item is rendered. `createItemTracker({ onBind, onUnbind })` returns a
function. Call it with the grid element in a `render` handler, set `anchor-name`
on the anchored index's element in `onBind`, clear it in `onUnbind`, and give the
popover a matching `position-anchor`.

## Scroll Mode

The library uses the `grid-auto-flow` CSS property to infer scroll direction.
Set it to `column` to enable horizontal scroll. In column flow, also set a fixed
number of rows with `grid-template-rows`, because those rows divide the list
into columns.

```css
.scroller {
  overflow-x: auto;
}
.grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, 6rem);
  grid-auto-columns: 6rem;
  gap: 1rem;
}
```

## Caveats

Put `<VirtualGrid>` inside an element that scrolls. Do not set `overflow` or a
fixed height on `<VirtualGrid>` itself. After computing, the grid sets its own
height (or width in column flow), overriding whatever you set, and the page
scrolls instead of the grid.

All items in a grid must have the same width and height. That size can change
with the viewport. For example, items can be 200px by 200px below 768px and
300px by 500px above it. The grid measures the probe again after the change.

## Development

- Setup: `pnpm install`
- Run dev playground: `pnpm --filter=playground run dev`
- Lint: `pnpm --filter=vvirtual-grid run lint`
- Build the library: `pnpm --filter=vvirtual-grid run build`
- Run tests: `pnpm run test`

### How to Release a New Version

We use [changelogen][changelogen] to generate changelogs and bump versions:

```shell
pnpm --filter=vvirtual-grid run release
```

[npm]: https://www.npmjs.com/package/vvirtual-grid
[changelogen]: https://github.com/unjs/changelogen
[anchor]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning
