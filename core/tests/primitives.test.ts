import { describe, it, expect, vi } from "vitest";
import {
  createItemTracker,
  getItemElement,
  getItemIndex,
  getItemViewportRect,
  getGridDimensions,
  getIndexByCell,
  getItemCellByIndex,
  getItemRectByIndex,
  type ItemLayout,
} from "../src/primitives";
import { getItemOffsetByIndex } from "../src/pipeline";

const rowLayout: ItemLayout = {
  flow: "row",
  columns: 3,
  rows: 1,
  colGap: 20,
  rowGap: 10,
  itemWidthWithGap: 120,
  itemHeightWithGap: 60,
};

const columnLayout: ItemLayout = {
  ...rowLayout,
  flow: "column",
  columns: 1,
  rows: 2,
};

const rect = () => ({ x: 0, y: 0, width: 0, height: 0 });
const cell = () => ({ row: 0, column: 0 });
const dimensions = () => ({ rowCount: 0, columnCount: 0 });

describe("getItemRectByIndex", () => {
  it("computes the rect of an item in row flow", () => {
    expect(getItemRectByIndex(7, rowLayout, rect())).toEqual({
      x: 120,
      y: 120,
      width: 100,
      height: 50,
    });
  });

  it("computes the rect of an item in column flow", () => {
    expect(getItemRectByIndex(7, columnLayout, rect())).toEqual({
      x: 360,
      y: 60,
      width: 100,
      height: 50,
    });
  });

  it("agrees with the offset used to render the items", () => {
    for (const layout of [rowLayout, columnLayout]) {
      for (const index of [0, 1, 5, 1000, 123457]) {
        const { x, y } = getItemRectByIndex(index, layout, rect());
        expect({ x, y }).toEqual(getItemOffsetByIndex(index, layout));
      }
    }
  });

  it("fills and returns the given object", () => {
    const out = rect();
    expect(getItemRectByIndex(4, rowLayout, out)).toBe(out);
    expect(out).toEqual({ x: 120, y: 60, width: 100, height: 50 });
  });
});

describe("getItemCellByIndex / getIndexByCell", () => {
  it("computes the cell in row flow", () => {
    expect(getItemCellByIndex(7, rowLayout, cell())).toEqual({
      row: 2,
      column: 1,
    });
  });

  it("computes the cell in column flow", () => {
    expect(getItemCellByIndex(7, columnLayout, cell())).toEqual({
      row: 1,
      column: 3,
    });
  });

  it("round-trips between index and cell", () => {
    for (const layout of [rowLayout, columnLayout]) {
      for (const index of [0, 1, 2, 3, 7, 999]) {
        const { row, column } = getItemCellByIndex(index, layout, cell());
        expect(getIndexByCell(row, column, layout)).toBe(index);
      }
    }
  });
});

describe("getGridDimensions", () => {
  it("counts rows and columns in row flow", () => {
    expect(getGridDimensions(10, rowLayout, dimensions())).toEqual({
      rowCount: 4,
      columnCount: 3,
    });
    expect(getGridDimensions(2, rowLayout, dimensions())).toEqual({
      rowCount: 1,
      columnCount: 2,
    });
  });

  it("counts rows and columns in column flow", () => {
    expect(getGridDimensions(7, columnLayout, dimensions())).toEqual({
      rowCount: 2,
      columnCount: 4,
    });
  });
});

describe("DOM primitives", () => {
  function createRoot(indexes: (number | null)[]): HTMLElement {
    const root = document.createElement("div");
    for (const index of indexes) {
      const el = document.createElement("div");
      if (index !== null) el.setAttribute("data-index", String(index));
      el.appendChild(document.createElement("span"));
      root.appendChild(el);
    }
    return root;
  }

  it("adds the position of the first child to get a viewport rect", () => {
    const root = createRoot([null, 0, 1]);
    root.firstElementChild!.getBoundingClientRect = () =>
      ({ left: 15, top: -400 }) as DOMRect;
    const out = rect();

    expect(getItemViewportRect(root, 7, rowLayout, out)).toBe(true);
    expect(out).toEqual({ x: 135, y: -280, width: 100, height: 50 });
  });

  it("leaves out untouched when the grid is empty", () => {
    const out = rect();

    expect(getItemViewportRect(createRoot([]), 7, rowLayout, out)).toBe(false);
    expect(out).toEqual(rect());
  });

  it("maps between indexes and marked elements", () => {
    const root = createRoot([null, 12, 10, 11]);

    expect(getItemElement(root, 10)).toBe(root.children[2]);
    expect(getItemElement(root, 0)).toBeNull();
    expect(getItemIndex(root, root.children[3]!.firstElementChild)).toBe(11);
    expect(getItemIndex(root, root.children[0]!)).toBe(-1);
    expect(getItemIndex(root, document.createElement("div"))).toBe(-1);
  });

  it("tracks the elements bound to indexes", () => {
    const onBind = vi.fn();
    const onUnbind = vi.fn();
    const track = createItemTracker(onBind, onUnbind);
    const root = createRoot([null, 0, 1]);
    const [, first, second] = Array.from(root.children);

    track(root);
    expect(onBind.mock.calls).toEqual([
      [0, first],
      [1, second],
    ]);
    expect(onUnbind).not.toHaveBeenCalled();

    // nothing changed
    track(root);
    expect(onBind).toHaveBeenCalledTimes(2);

    // a recycled element renders another item, another element takes over 1
    first!.setAttribute("data-index", "2");
    const replacement = document.createElement("div");
    replacement.setAttribute("data-index", "1");
    root.replaceChild(replacement, second!);
    track(root);

    expect(onBind.mock.calls.slice(2)).toEqual([
      [2, first],
      [1, replacement],
    ]);
    expect(onUnbind.mock.calls).toEqual([[0]]);
  });

  it("works with only one of the callbacks", () => {
    const onUnbind = vi.fn();
    const track = createItemTracker(undefined, onUnbind);
    const root = createRoot([0]);

    track(root);
    root.firstElementChild!.remove();
    track(root);
    expect(onUnbind.mock.calls).toEqual([[0]]);
  });
});
