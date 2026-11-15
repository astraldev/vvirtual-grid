import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, ref, Suspense, type App, type Ref } from "vue";
import Grid from "../src/Grid.vue";

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

type Rect = { x: number; y: number; width: number; height: number };
type GridHandle = {
  ready: boolean;
  measurement: { columns: number; flow: string } | undefined;
  getItemRect(
    index: number,
    out: Rect,
    relativeTo?: "viewport" | "grid",
  ): boolean;
  getItemCell(index: number, out: { row: number; column: number }): boolean;
  getGridDimensions(out: { rowCount: number; columnCount: number }): boolean;
  getItemElement(index: number): HTMLElement | null;
  getItemIndex(target: EventTarget | null): number;
};

const LENGTH = 1000;
let app: App | undefined;
let host: HTMLElement;

// a stable function: a new page provider makes the grid render from scratch
const pageProvider = (page: number, size: number) =>
  Array.from({ length: size }, (_, i) => ({ name: `item ${page * size + i}` }));

async function mountGrid(props: Record<string, unknown> = {}, mark = true) {
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
  // template refs of async components are bound on the next parent render
  app._instance!.proxy!.$forceUpdate();
  await nextTick();

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

const rect = (): Rect => ({ x: -1, y: -1, width: -1, height: -1 });

describe("Grid primitives", () => {
  it("fills the rect of rendered and virtualized items", async () => {
    const { grid } = await mountGrid();
    const out = rect();
    expect(grid.value.ready).toBe(true);

    // 3 columns, 110px x 60px cells
    expect(grid.value.getItemRect(4, out)).toBe(true);
    expect(out).toEqual({ x: 110, y: 60, width: 100, height: 50 });

    // item 900 is far outside of the rendered buffer
    expect(grid.value.getItemElement(900)).toBeNull();
    expect(grid.value.getItemRect(900, out)).toBe(true);
    expect(out).toEqual({ x: 0, y: 18000, width: 100, height: 50 });

    expect(grid.value.getItemRect(900, out, "viewport")).toBe(true);
    expect(out).toEqual({
      x: GRID_ORIGIN.left,
      y: GRID_ORIGIN.top + 18000,
      width: 100,
      height: 50,
    });
  });

  it("agrees with the transform given to the rendered items", async () => {
    const { grid } = await mountGrid();
    const out = rect();
    grid.value.getItemRect(4, out);

    expect(grid.value.getItemElement(4)!.style.transform).toBe(
      `translate(${out.x}px, ${out.y}px)`,
    );
  });

  it("leaves out untouched for indexes out of range", async () => {
    const { grid } = await mountGrid();
    const out = rect();

    expect(grid.value.getItemRect(-1, out)).toBe(false);
    expect(grid.value.getItemRect(LENGTH, out)).toBe(false);
    expect(grid.value.getItemRect(1.5, out, "viewport")).toBe(false);
    expect(out).toEqual(rect());
    expect(grid.value.getItemCell(LENGTH, { row: 0, column: 0 })).toBe(false);
  });

  it("exposes the order of items and the total counts", async () => {
    const { grid } = await mountGrid();
    const cell = { row: 0, column: 0 };
    const dimensions = { rowCount: 0, columnCount: 0 };

    expect(grid.value.getItemCell(900, cell)).toBe(true);
    expect(cell).toEqual({ row: 300, column: 0 });
    expect(grid.value.getGridDimensions(dimensions)).toBe(true);
    expect(dimensions).toEqual({ rowCount: 334, columnCount: 3 });
    expect(grid.value.measurement).toMatchObject({ columns: 3, flow: "row" });
  });

  it("maps indexes to elements and back", async () => {
    const { grid, root } = await mountGrid();
    const el = grid.value.getItemElement(3)!;

    expect(el.getAttribute("data-index")).toBe("3");
    expect(grid.value.getItemIndex(el)).toBe(3);
    expect(grid.value.getItemIndex(el.firstElementChild)).toBe(3);
    expect(grid.value.getItemIndex(root)).toBe(-1);
    expect(grid.value.getItemIndex(root.firstElementChild)).toBe(-1); // probe
    expect(grid.value.getItemIndex(document.body)).toBe(-1);
    expect(grid.value.getItemIndex(null)).toBe(-1);
  });

  it("finds no element when the slots do not mark them", async () => {
    const { grid } = await mountGrid({}, false);

    expect(grid.value.getItemElement(3)).toBeNull();
  });
});

describe("Grid hooks", () => {
  it("reports the elements bound to items", async () => {
    const onItemBind = vi.fn();
    const onItemUnbind = vi.fn();
    const { grid } = await mountGrid({ onItemBind, onItemUnbind });

    expect(onItemBind).toHaveBeenCalledWith(0, grid.value.getItemElement(0));
    // every rendered item was reported exactly once
    const indexes = onItemBind.mock.calls.map(([index]) => index);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(indexes.length).toBe(host.querySelectorAll("[data-index]").length);
    expect(onItemUnbind).not.toHaveBeenCalled();
  });

  it("reports the items that stop being rendered", async () => {
    const onItemUnbind = vi.fn();
    const { root } = await mountGrid({ onItemUnbind });
    const rendered = host.querySelectorAll("[data-index]").length;
    expect(rendered).toBeGreaterThan(0);

    // scroll the grid 300 rows up
    vi.mocked(Element.prototype.getBoundingClientRect).mockImplementation(
      () => ({ left: 0, top: -18000, width: 100, height: 50 }) as DOMRect,
    );
    window.dispatchEvent(new Event("scroll"));
    await wait();
    await nextTick();

    expect(root.querySelector('[data-index="0"]')).toBeNull();
    expect(onItemUnbind).toHaveBeenCalledWith(0);
    expect(onItemUnbind).toHaveBeenCalledTimes(rendered);
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
