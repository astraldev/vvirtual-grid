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

| Name       | Type           | Description                                             |
| ---------- | -------------- | ------------------------------------------------------- |
| `allItems` | `Ref`          | All items memoized by the grid                          |
| `ready`    | `Ref<boolean>` | Whether the buffer has started calculating with the DOM |

## Scroll Mode

The library uses the `grid-auto-flow` CSS property to infer scroll direction.
Set it to `column` to enable horizontal scroll.

## Caveats

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
