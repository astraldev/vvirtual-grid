# TODO

## Later: items that span cells or differ in size

Not for now. Explicitly opt-in, through a prop, so the fixed-size path stays exactly as fast.

Today every item fills one cell of the probe's size. Position, rendered window and content size
are index arithmetic, O(1), with no per-item state.

### What to support

- **Spans:** an item covers several tracks, like `grid-column: span 2`, `span 4`, or
  `grid-row: span 2`. Example: a 4-column grid with items of span 2, 1, 1, 4, 2, 2.
- **Different sizes:** rows (or columns in column flow) of different heights, known up front or
  measured.

### Prop options

- `itemSpan: (index: number) => { column: number; row: number }`: the span of each item, from data.
- `itemSize: (index: number) => number`: a known size per row, from data.
- `dynamicSize: boolean`: measure rendered items with a `ResizeObserver`, with an estimate for the rest.

### What changes

- **Placement:** with spans, an index no longer maps to a cell by arithmetic. A placement pass
  walks the items in order and packs them row by row, like CSS grid auto-placement. Decide whether
  to match `grid-auto-flow: dense`. Store each item's row and column start in typed arrays
  (`Uint32Array`), computed lazily up to the furthest index needed.
- **Offsets:** a Fenwick tree (or block prefix sums) over row sizes maps row to offset and offset to
  row in O(log n).
- **Rendered window:** find the first visible row from the scroll offset, then the first item placed
  in that row. Items spanning into the window from rows above must render too.
- **Scroll anchoring:** when a measured size differs from its estimate above the viewport, adjust
  the scroll position by the difference so visible items do not jump.
- **Content size, `scrollTo`:** sums over rows. Approximate until rows before the target are
  measured or placed.
- **Primitives:** `getItemRect` reads placement and offsets instead of multiplying, and returns
  the spanned width and height. `getItemCell` returns the start cell. `getIndexByCell` returns the
  item covering that cell.

### Measure before shipping

- Placement cost for 1,000,000 items, and memory (two `Uint32Array` of 4 MB each).
- One `ResizeObserver` entry per rendered item with `dynamicSize`.
- Scroll benchmark with the props on and off. With them off, nothing may change.

## Review notes on PR #3

- Drop the `valueRef` alias in `useObservable` and write to `target` directly.
- Cut the exports of `primitives.ts` to the functions and the types users need.
- Stop `index.ts` from re-exporting everything in `pipeline.ts`.
- Replace the "created once" code comment in the primitives sample with a performance note.
- Explain `out` in the docs: the object the result is written into and returned. Consider
  making it optional, allocating only when it is left out.
- Docs are hard to read and follow. Rewrite for a reader with no context.
- Every page under Guides must be a guide: a goal, then numbered steps in procedural
  sentences ("Add `role="list"` to `<VirtualGrid>`"), each with its code, ending in a result
  the reader can check. Move reference material (role tables, API facts) to Reference.
  - Accessibility: open with what the reader builds (a grid a screen reader announces as
    "item 4,200 of 10,000"), state why the grid cannot do it alone (most items are not in the
    DOM), then steps: set the list roles, set `aria-setsize` and `aria-posinset`, mark
    placeholders busy, add keyboard focus, verify with a screen reader.
  - Popovers, sizing and direction, performance: same shape.
- Accessibility, "Pick a role": the "Fits the grid's DOM" column is unclear. It meant "can
  this role pattern be built from the flat list of elements the grid renders". Rewrite as
  prose or move the table to Reference with a clear column name and a sentence of context.
- Popovers: add a guide for Floating UI (`useFloating` / `computePosition`). Show a virtual
  element whose `getBoundingClientRect()` returns the grid's computed rect for an index, so
  the floating element follows items that are not rendered.
- `out`: explain why it exists. Writing into an object the caller owns means a call creates
  no object, like an output parameter in a C API (`void get_rect(int index, Rect *out)`).
- Add helpers that create the reusable argument objects in one call, so users do not write
  `{ root: null, index: -1, layout: null, out: { x: 0, y: 0, width: 0, height: 0 } }` by
  hand. Pick a clear name, not `initRectArgs`. Candidates: `createRectQuery()`,
  `createCellQuery()`, `createDimensionsQuery()`.
- Sizing, "Scroll horizontally": the sample is a bare `<VirtualGrid>` tag in a `vue` fence, so
  it does not highlight. Wrap it in `<template>` (and a `<script setup>` if needed).
- Performance, "Keep callbacks cheap": the sample and prose do not say why a reused, writable
  object matters. State the cost: `onViewportScroll` runs on every scroll event, and a new
  object per event becomes garbage the collector must reclaim during scrolling.
- Performance: "Write styles after it, not between two reads" is unclear. Explain layout
  thrashing: reading layout after writing a style forces the browser to recompute layout
  immediately. Read every rect first, then write every style.
- Performance, "Keep items stable": name what "items" means (the rendered slot elements and
  the data objects behind them) or rename the section.
- Performance, "Request fewer pages": too important to sit near the end. Move
  `pageProviderDebounceTime` up front, as the first step for any network provider. Also point to
  it from the `pageProvider` docs (Utilities) and the VirtualGrid props table.
- Remove the tree-shaking sentences. They change no decision a reader makes:
  - `guides/performance`: "A bundle that imports only `VirtualGrid` contains none of the primitives."
  - `reference/primitives`: "The grid does not import `vvirtual-grid/primitives`. A bundle that imports none of them contains none of them."
  - Changelog 1.2.0 "Build" entry: drop the second sentence.
- Changelog page: say that `vvirtual-grid` is a fork of
  [`vue-virtual-scroll-grid`](https://github.com/rocwang/vue-virtual-scroll-grid) by Roc Wang,
  published on npm up to 1.11.0. Releases before the fork are in that repository, not here.
  This changelog starts at the fork (1.1.x).
- Accessibility, keyboard focus: turn it into a guide with steps and code, not loose sentences.
  - "The grid does not handle keys." and "A roving tabindex works with virtualized items." are
    two contexts side by side. Split them (new paragraph or callout) or drop the second.
  - "on the item whose index matches": matches what. Name it: the focused index you keep in a ref.
  - "On an arrow key": how the reader got there is never shown. Add the step that listens for
    `keydown` on the grid, then map each arrow key to a row or column change.
- Utilities intro: "or write one for an API" is unclear. Write "or
  [write your own provider for an API](#write-your-own-pageprovider)", linking to the section.
- Utilities, rejected promise warning: rewrite so it flows. Draft from review: "The virtual
  grid does not handle a rejected promise. If your provider throws or rejects, the grid stops
  loading pages. Handle errors inside the provider and return an empty array instead."
- Too many primitives (8). Proposed cut to 4, pending decision:
  - Merge `getItemRectByIndex` and `getItemViewportRect` into `getItemRect`. Without `root`
    it returns grid coordinates. With `root` it adds the grid's viewport origin.
  - Keep `getItemCell` and `getIndexByCell`, the two-way index and cell mapping that
    `grid-auto-flow: column` makes non-trivial.
  - Drop `getGridDimensions`: `Math.ceil(length / columns)` and friends. Document the formula.
  - Drop `getItemElement` and `getItemIndex`. They wrap native DOM calls. Document
    `root.querySelector(':scope > [data-index="42"]')` and `target.closest("[data-index]")`.
  - Keep `createItemTracker`, the only one that is real work to rewrite (diffing rendered
    elements without allocating). Or drop it too, if `onRender` plus a query is enough.
- VirtualGrid warning, use the reviewed wording (with "its", not "it's"): "Do not set `overflow`
  or a fixed height on `<VirtualGrid>` itself. After computing, the grid sets its own height,
  overriding whatever you set, and the page scrolls instead of the grid."
- Callbacks: switch `onRender`, `onViewportScroll` and `onLayoutChange` from function props to
  emitted events (`defineEmits`: `render`, `viewport-scroll`, `layout-change`). Usage in
  templates stays `@render` and so on. Benchmark the scroll path before and after, since
  `viewport-scroll` fires on every scroll event. Document them under "Events", not "Props".
- Primitives intro, reword in the same voice. Draft: "The grid does not add ARIA roles, focus
  handling or overlays. Instead, it gives you the positions it already computes, so you can
  build them yourself. Use the primitives to get an item's rectangle, or its row and column,
  even when the item is not rendered."
- Run the editorial checklist (`dotfiles/.agents/skills/editorial/references/checklist.md`)
  on every page, item by item, and report it with evidence. It was not run on the first pass,
  only the banned-word and punctuation greps.
