# vvirtual-grid

A reusable component for Vue 3 that renders a list with a huge number of
items (e.g. 1000+ items) as a grid in a performant way.

- [NPM Package][npm]

## Features

- Use virtual-scrolling / windowing to render the items, so the number of DOM
  nodes is kept low.
- Just use CSS grid to style your grid. Minimum styling opinions from the
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
  <VirtualGrid
    :length="1000"
    :pageProvider="async (pageNumber, pageSize) => Array(pageSize).fill('x')"
    :pageSize="40"
    :scrollTo="10"
  >
    <template v-slot:default="{ item, style, index }">
      <div :style="style">{{ item }} {{ index }}</div>
    </template>
    <template v-slot:placeholder="{ index, style }">
      <div :style="style">Placeholder {{ index }}</div>
    </template>
    <template v-slot:probe>
      <div class="item">Probe</div>
    </template>
  </VirtualGrid>
</template>
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
| `pageProvider`             | The callback that returns a page of items as a promise. `pageNumber` starts at 0 | `(pageNumber: number, pageSize: number) => Promise<T[]>` | Required                                                         |
| `pageSize`                 | The number of items in a page from the item provider (e.g. a backend API)        | `number`                                                 | Required, an integer greater than or equal to 1                  |
| `pageProviderDebounceTime` | Debounce window in milliseconds on the calls to `pageProvider`                   | `number`                                                 | Optional, an integer greater than or equal to 0, defaults to `0` |
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

**If not provided, you must set a fixed height to `grid-template-rows` in your
CSS grid, e.g. `200px`. If provided, make sure it is styled with the same
dimensions as rendered items in the `default` or `placeholder` slots. Otherwise
the view won't render correctly, or rendering could be very slow.**

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

## Low-level Primitives

The grid does not add roles, ARIA attributes, focus handling or overlays. It
exposes the raw data it already computes, so you can build those yourself.

The primitives are plain functions in `vvirtual-grid/primitives`. The grid does
not import them, so what you do not use is not in your bundle. Functions that
take `out` fill your object instead of allocating one.

Every function takes one object. Create it once, change `index` (or
`target`) and call it again, so a call allocates nothing.

| Function                                                     | Description                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `getItemRectByIndex({ index, layout, out }): ItemRect`       | `x`, `y`, `width`, `height` of an item relative to the first item, **rendered or not**. Pure arithmetic.                  |
| `getItemViewportRect({ root, index, layout, out }): boolean` | The same relative to the viewport, like `getBoundingClientRect()`. Reads the layout once. `false` when the grid is empty. |
| `getItemCellByIndex({ index, layout, out }): ItemCell`       | Zero-based visual `row` and `column` of an item.                                                                          |
| `getIndexByCell({ row, column, layout }): number`            | The index at a zero-based visual row and column.                                                                          |
| `getGridDimensions({ length, layout, out }): GridDimensions` | Total `rowCount` and `columnCount` of the whole list.                                                                     |
| `getItemElement({ root, index }): HTMLElement \| null`       | The element currently rendering an item, `null` when it is virtualized.                                                   |
| `getItemIndex({ root, target }): number`                     | The index of the item rendered by (or around) an element, e.g. `event.target`. `-1` when there is none.                   |
| `createItemTracker({ onBind, onUnbind }): (root) => void`    | Returns a function that reports what started and stopped rendering since its last call. Call it from `onRender`.          |

- `root` is the element of the grid (`gridRef.value.$el`).
- `layout` is the `measurement` exposed by the grid (see
  [Exposed Public Properties](#exposed-public-properties)). It is `undefined`
  until the grid is measured.
- The functions that deal with elements find them by a `data-index` attribute,
  so set `:data-index="index"` on the root element of your `default` and
  `placeholder` slots.

The grid itself only adds three callback props. They do nothing while unset:

| Prop               | Called                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| `onRender`         | After the set of rendered items changed and the DOM was updated                |
| `onViewportScroll` | When a scroll parent of the grid scrolls, i.e. the items moved in the viewport |
| `onLayoutChange`   | After the grid is measured again (item size, gaps, tracks or flow changed)     |

### Example: ARIA attributes and a native popover

Everything below is userland code. The items are a flat list of elements, so
the `list` / `listitem` roles with `aria-setsize` / `aria-posinset` describe
them correctly even though most of them are not in the DOM. (`role="grid"`
needs `row` elements between the grid and its cells, which a flat list does
not have. `getItemCellByIndex` and `getGridDimensions` give you the numbers for
`aria-rowindex` / `aria-rowcount` if you render such a structure yourself.)

```vue
<script setup>
import { ref, useTemplateRef } from "vue";
import { VirtualGrid } from "vvirtual-grid/vue";
import { getItemIndex, getItemViewportRect } from "vvirtual-grid/primitives";

const length = 10000;
const grid = useTemplateRef("grid");
const popover = useTemplateRef("popover");
const anchored = ref(-1); // the index the popover is bound to
// reused on every call, never reallocated
const rectArgs = {
  root: null,
  index: -1,
  layout: null,
  out: { x: 0, y: 0, width: 0, height: 0 },
};

function place() {
  rectArgs.root = grid.value.$el;
  rectArgs.index = anchored.value;
  rectArgs.layout = grid.value.measurement;
  if (rectArgs.index < 0 || !rectArgs.layout) return;
  // works even while the item is scrolled out and not rendered
  if (!getItemViewportRect(rectArgs)) return;
  const { x, y, height } = rectArgs.out;
  popover.value.style.left = x + "px";
  popover.value.style.top = y + height + "px";
}

function show(event) {
  const index = getItemIndex({ root: grid.value.$el, target: event.target });
  if (index === -1) return;
  anchored.value = index;
  place();
  popover.value.showPopover();
}
</script>

<template>
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

  <div ref="popover" popover style="position: fixed; margin: 0">
    Item {{ anchored }}
  </div>
</template>
```

Where [CSS anchor positioning][anchor] is supported you can skip `place()`
while the item is rendered: pass `createItemTracker({ onBind, onUnbind })` to
`onRender` to set and clear `anchor-name` on the element of the anchored index,
and give the popover a matching `position-anchor`.

## Scroll Mode

The library uses the `grid-auto-flow` CSS property to infer scroll direction.
Set it to `column` to enable horizontal scroll.

## Caveats

The grid sets its own `height` (or `width` in column flow) to the size of the
whole list. Put it inside an element that scrolls, and do not set `overflow`
or a fixed height on the grid itself.

The library does not require items to have a foreknown width and height, but
does require them to be styled with the **same** width and height under a given
viewport. For example, items may be `200px × 200px` below 768 px and
`300px × 500px` above it — this is supported.

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
