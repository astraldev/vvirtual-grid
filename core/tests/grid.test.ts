import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, ref, Suspense, type App, type Ref } from "vue";
import Grid from "../src/Grid.vue";
import type { ResizeMeasurement } from "../src/pipeline";
import {
  createCellQuery,
  createItemTracker,
  createRectQuery,
  getItemCell,
  getItemRect,
} from "../src/primitives";

// the element rendering an index (happy-dom has no :scope, so match children)
const getItemElement = (root: Element, index: number) =>
  (Array.from(root.children).find(
    (el) => el.getAttribute("data-index") === String(index),
  ) as HTMLElement | undefined) ?? null;

// region: a ResizeObserver that the tests drive by hand
type Observed = { callback: ResizeObserverCallback; target: Element };
const observed: Observed[] = [];

class ManualResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    observed.push({ callback: this.callback, target });
  }
  unobserve() {}
  disconnect() {}
}

const ITEM = { width: 100, height: 50 };
const itemSize = { ...ITEM };
const GRID_ORIGIN = { left: 20, top: 30 };

function flushResizeObservers() {
  for (const { callback, target } of observed.slice()) {
    const isProbe = target !== host.firstElementChild;
    callback(
      [
        {
          target,
          contentRect: isProbe ? { ...itemSize } : { width: 320, height: 1000 },
        } as unknown as ResizeObserverEntry,
      ],
      undefined as unknown as ResizeObserver,
    );
  }
}

const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));
// endregion

type GridHandle = {
  ready: boolean;
  allItems: unknown[];
  measurement: ResizeMeasurement | undefined;
};

const LENGTH = 1000;
let app: App | undefined;
let host: HTMLElement;

// a stable function: a new page provider makes the grid render from scratch
const pageProvider = (page: number, size: number) =>
  Array.from({ length: size }, (_, i) => ({ name: `item ${page * size + i}` }));

async function mountGrid(
  props: Record<string, unknown> = {},
  mark = true,
  rerender = true,
) {
  const grid = ref<GridHandle>();
  host = document.createElement("div");
  document.body.appendChild(host);

  app = createApp({
    render: () =>
      h(Suspense, null, {
        default: () =>
          h(
            Grid as never,
            {
              ref: grid,
              length: LENGTH,
              pageSize: 50,
              pageProvider,
              style:
                "display: grid; grid-template-columns: 100px 100px 100px; row-gap: 10px; column-gap: 10px",
              ...props,
            },
            {
              default: ({ item, style, index }: any) =>
                h("div", { style, "data-index": mark ? index : undefined }, [
                  h("span", item.name),
                ]),
            },
          ),
      }),
  });
  app.mount(host);

  // resolve the async setup, then let the grid measure itself
  await wait();
  flushResizeObservers();
  await wait();
  flushResizeObservers();
  await wait();
  if (rerender) {
    app._instance!.proxy!.$forceUpdate();
    await nextTick();
  }

  return { grid: grid as Ref<GridHandle>, root: host.firstElementChild! };
}

beforeEach(() => {
  observed.length = 0;
  Object.assign(itemSize, ITEM);
  vi.stubGlobal("ResizeObserver", ManualResizeObserver);
  // happy-dom does not lay out, so place the grid by hand
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        left: GRID_ORIGIN.left,
        top: GRID_ORIGIN.top,
        width: ITEM.width,
        height: ITEM.height,
      }) as DOMRect,
  );
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  host?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("primitives used with a mounted grid", () => {
  it("exposes its refs without a parent render", async () => {
    const { grid } = await mountGrid({}, true, false);

    expect(grid.value.ready).toBe(true);
    expect(grid.value.measurement).toBeDefined();
    expect(grid.value.allItems.length).toBe(LENGTH);
  });

  it("exposes the measurement the items are positioned with", async () => {
    const { grid } = await mountGrid();

    expect(grid.value.ready).toBe(true);
    // 3 columns, 110px x 60px cells
    expect(grid.value.measurement).toEqual({
      colGap: 10,
      rowGap: 10,
      flow: "row",
      columns: 3,
      rows: 1,
      itemWidthWithGap: 110,
      itemHeightWithGap: 60,
    });
  });

  it("fills the rect of rendered and virtualized items", async () => {
    const { grid, root } = await mountGrid();
    const query = createRectQuery({ index: 4, layout: grid.value.measurement });

    expect(getItemRect(query)).toBe(true);
    expect(query.rect).toMatchObject({ x: 110, y: 60, width: 100, height: 50 });
    expect(getItemElement(root, 4)!.style.transform).toBe(
      `translate(${query.rect.x}px, ${query.rect.y}px)`,
    );

    // item 900 is far outside of the rendered buffer
    expect(getItemElement(root, 900)).toBeNull();
    query.index = 900;
    query.root = root;
    expect(getItemRect(query)).toBe(true);
    expect(query.rect).toEqual({
      x: GRID_ORIGIN.left,
      y: GRID_ORIGIN.top + 18000,
      width: 100,
      height: 50,
      left: GRID_ORIGIN.left,
      top: GRID_ORIGIN.top + 18000,
      right: GRID_ORIGIN.left + 100,
      bottom: GRID_ORIGIN.top + 18050,
    });
  });

  it("gives the row and column of any item", async () => {
    const { grid } = await mountGrid();
    const query = createCellQuery({
      index: 900,
      layout: grid.value.measurement,
    });

    expect(getItemCell(query)).toBe(true);
    expect(query.cell).toEqual({ row: 300, column: 0 });
  });

  it("finds item elements by data-index", async () => {
    const { root } = await mountGrid();
    const el = getItemElement(root, 3)!;

    expect(el.getAttribute("data-index")).toBe("3");
    expect(el.firstElementChild!.closest("[data-index]")).toBe(el);
  });

  it("finds no element when the slots do not mark them", async () => {
    const { root } = await mountGrid({}, false);

    expect(getItemElement(root, 3)).toBeNull();
  });
});

describe("Grid hooks", () => {
  it("reports the elements bound to items on the render event", async () => {
    const onBind = vi.fn();
    const onUnbind = vi.fn();
    const track = createItemTracker({ onBind, onUnbind });
    const { root } = await mountGrid({
      onRender: () => track(host.firstElementChild!),
    });
    const rendered = host.querySelectorAll("[data-index]").length;

    expect(rendered).toBeGreaterThan(0);
    expect(onBind).toHaveBeenCalledWith(0, getItemElement(root, 0));
    // every rendered item was reported exactly once
    const indexes = onBind.mock.calls.map(([index]) => index);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(indexes.length).toBe(rendered);
    expect(onUnbind).not.toHaveBeenCalled();

    // scroll the grid 300 rows up
    vi.mocked(Element.prototype.getBoundingClientRect).mockImplementation(
      () => ({ left: 0, top: -18000, width: 100, height: 50 }) as DOMRect,
    );
    window.dispatchEvent(new Event("scroll"));
    await wait();
    await nextTick();

    expect(root.querySelector('[data-index="0"]')).toBeNull();
    expect(onUnbind).toHaveBeenCalledWith(0);
    expect(onUnbind).toHaveBeenCalledTimes(rendered);
    expect(onBind).toHaveBeenCalledWith(900, getItemElement(root, 900));
  });

  it("reports scrolls and layout changes", async () => {
    const onViewportScroll = vi.fn();
    const onLayoutChange = vi.fn();
    await mountGrid({ onViewportScroll, onLayoutChange });

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("scroll"));
    expect(onViewportScroll).toHaveBeenCalledTimes(1);

    itemSize.height = 80;
    flushResizeObservers();
    await wait();
    await nextTick();
    expect(onLayoutChange).toHaveBeenCalledTimes(2);
  });
});
