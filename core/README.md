# vvirtual-grid

A reusable component for Vue 3 that renders a list with a huge number of
items (e.g. 1000+ items) as a grid in a performant way.

- [Documentation](https://vvirtual-grid.com)
- [NPM Package][npm]

## Features

- Use virtual-scrolling / windowing to render the items, so the number of DOM
  nodes is kept low.
- Use CSS grid to style your grid. Minimum styling opinions from the
  library.
- Support using a paginated API to load the items in the background.
- Support rendering placeholders for unloaded items.
- Support both vertical and horizontal scroll.
- Loaded items are cached for better performance.

## Install

```shell
npm install vvirtual-grid
```

## Usage

### Vue

Import and use the `VirtualGrid` component directly:

```vue
<script setup>
import { VirtualGrid } from "vvirtual-grid/vue";
</script>

<template>
  <div class="scroller">
    <VirtualGrid
      class="grid"
      :length="1000"
      :pageProvider="async (pageNumber, pageSize) => Array(pageSize).fill('x')"
      :pageSize="40"
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

The grid scrolls inside the nearest ancestor that scrolls. It is a CSS grid, and
the probe has the size of one item:

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
| `pageProviderDebounceTime` | **Most important for network providers.** Milliseconds to wait before calling `pageProvider`. Pages skipped meanwhile are never requested | `number`                                                 | Optional, an integer greater than or equal to 0, defaults to `0` |
| `probeTag`                 | The HTML tag used as probe element                                               | `string`                                                 | Optional, any valid HTML tag, defaults to `div`                  |
| `respectScrollToOnResize`  | Snap to the position set by `scrollTo` when the grid container is resized        | `boolean`                                                | Optional, defaults to `true`                                     |
| `scrollBehavior`           | The behavior of `scrollTo`                                                       | `"smooth"` &#124; `"auto"`                               | Optional, defaults to `"smooth"`                                 |
| `scrollTo`                 | Scroll to a specific item by index                                               | `number`                                                 | Optional, an integer from 0 to `length - 1`                      |
| `tag`                      | The HTML tag used as container element                                           | `string`                                                 | Optional, any valid HTML tag, defaults to `div`                  |
| `getKey`                   | The `:key` used on each grid item. Auto-generated, but overridable via function  | `(internalItem: InternalItem) => number \| string`       | Optional                                                         |

## Available Slots

There are 3 scoped slots: `default`, `placeholder` and `probe`.

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
slots. The grid places every item at the probe's size, so a taller item overlaps
the next row and a shorter one leaves a gap.

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
| `allItems`    | `Ref`                                 | All items memoized by the grid                                                                                                        |
| `ready`       | `Ref<boolean>`                        | Whether the buffer has started calculating with the DOM                                                                               |
| `measurement` | `Ref<ResizeMeasurement \| undefined>` | The measurement the items are positioned with: `flow`, `columns`, `rows`, `colGap`, `rowGap`, `itemWidthWithGap`, `itemHeightWithGap` |

## Events

The grid emits three events. None of them carries a payload.

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
      :pageProvider="pageProvider"
      :pageSize="40"
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

The [primitives reference](https://vvirtual-grid.com/reference/primitives) and the
[popovers guide](https://vvirtual-grid.com/guides/popovers) cover this section in
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
| `getItemRect(query): boolean`                             | The item's rectangle, **rendered or not**. With `root: null` it is relative to item 0. With `root` set to the grid element, relative to the viewport, like `getBoundingClientRect()`. `false` when `layout` is `undefined` or nothing is rendered. |
| `createCellQuery({ index?, layout? }): CellQuery`         | Creates the reusable query for `getItemCell` and `getIndexByCell`. The result goes into `query.cell`.                                      |
| `getItemCell(query): boolean`                             | Writes the zero-based visual `row` and `column` of `query.index` into `query.cell`. `false` without `layout`.                              |
| `getIndexByCell(query): number`                           | The index at `query.cell`. `-1` without `layout`.                                                                                           |
| `createItemTracker({ onBind, onUnbind }): (root) => void` | Returns a function that reports what started and stopped rendering since its last call. Call it with the grid element on `render`.         |

- `root` is the element of the grid (`gridRef.value.$el`).
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
import { VirtualGrid } from "vvirtual-grid/vue";
import { createRectQuery, getItemRect } from "vvirtual-grid/primitives";

const length = 10000;
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
      :pageProvider="pageProvider"
      :pageSize="40"
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
        >
          {{ item }}
        </div>
      </template>
    </VirtualGrid>
  </div>

  <div ref="popover" popover style="position: fixed; margin: 0">
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
Set it to `column` to enable horizontal scroll.

## Caveats

Put `<VirtualGrid>` inside an element that scrolls. Do not set `overflow` or a
fixed height on `<VirtualGrid>` itself. After computing, the grid sets its own
height (or width in column flow), overriding whatever you set, and the page
scrolls instead of the grid.

The library does not require items to have a foreknown width and height, but
does require them to be styled with the **same** width and height under a given
viewport. For example, items may be `200px × 200px` below 768 px and
`300px × 500px` above it. Both are supported.

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
