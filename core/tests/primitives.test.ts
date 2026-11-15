import { describe, it, expect, vi } from "vitest";
import {
  createCellQuery,
  createItemTracker,
  createRectQuery,
  getIndexByCell,
  getItemCell,
  getItemRect,
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

const box = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
  left: x,
  top: y,
  right: x + width,
  bottom: y + height,
});

describe("createRectQuery / createCellQuery", () => {
  it("creates zeroed queries with the given fields", () => {
    expect(createRectQuery({ index: 3 })).toEqual({
      index: 3,
      layout: undefined,
      root: null,
      rect: box(0, 0, 0, 0),
    });
    expect(createCellQuery({ layout: rowLayout })).toEqual({
      index: 0,
      layout: rowLayout,
      cell: { row: 0, column: 0 },
    });
  });
});

describe("getItemRect", () => {
  it("computes the rect of an item in row flow", () => {
    const query = createRectQuery({ index: 7, layout: rowLayout });
    expect(getItemRect(query)).toBe(true);
    expect(query.rect).toEqual(box(120, 120, 100, 50));
  });

  it("computes the rect of an item in column flow", () => {
    const query = createRectQuery({ index: 7, layout: columnLayout });
    getItemRect(query);
    expect(query.rect).toEqual(box(360, 60, 100, 50));
  });

  it("agrees with the offset used to render the items", () => {
    const query = createRectQuery();
    for (const layout of [rowLayout, columnLayout]) {
      query.layout = layout;
      for (const index of [0, 1, 5, 1000, 123457]) {
        query.index = index;
        getItemRect(query);
        expect({ x: query.rect.x, y: query.rect.y }).toEqual(
          getItemOffsetByIndex(index, layout),
        );
      }
    }
  });

  it("writes into the same rect object on every call", () => {
    const query = createRectQuery({ layout: rowLayout });
    const rect = query.rect;
    query.index = 4;
    getItemRect(query);
    expect(query.rect).toBe(rect);
    expect(rect).toEqual(box(120, 60, 100, 50));
  });

  it("returns false without a layout", () => {
    const query = createRectQuery({ index: 4 });
    expect(getItemRect(query)).toBe(false);
    expect(query.rect).toEqual(box(0, 0, 0, 0));
  });

  it("adds the position of the grid's first child when root is set", () => {
    const root = document.createElement("div");
    root.appendChild(document.createElement("div"));
    root.firstElementChild!.getBoundingClientRect = () =>
      ({ left: 15, top: -400 }) as DOMRect;
    const query = createRectQuery({ index: 7, layout: rowLayout, root });

    expect(getItemRect(query)).toBe(true);
    expect(query.rect).toEqual(box(135, -280, 100, 50));
  });

  it("returns false when root has nothing rendered", () => {
    const query = createRectQuery({
      index: 7,
      layout: rowLayout,
      root: document.createElement("div"),
    });
    expect(getItemRect(query)).toBe(false);
  });
});

describe("getItemCell / getIndexByCell", () => {
  it("computes the cell in row flow", () => {
    const query = createCellQuery({ index: 7, layout: rowLayout });
    expect(getItemCell(query)).toBe(true);
    expect(query.cell).toEqual({ row: 2, column: 1 });
  });

  it("computes the cell in column flow", () => {
    const query = createCellQuery({ index: 7, layout: columnLayout });
    getItemCell(query);
    expect(query.cell).toEqual({ row: 1, column: 3 });
  });

  it("round-trips between index and cell", () => {
    const query = createCellQuery();
    for (const layout of [rowLayout, columnLayout]) {
      query.layout = layout;
      for (const index of [0, 1, 2, 3, 7, 999]) {
        query.index = index;
        getItemCell(query);
        expect(getIndexByCell(query)).toBe(index);
      }
    }
  });

  it("handles a missing layout", () => {
    const query = createCellQuery({ index: 7 });
    expect(getItemCell(query)).toBe(false);
    expect(getIndexByCell(query)).toBe(-1);
  });
});

describe("createItemTracker", () => {
  function createRoot(indexes: (number | null)[]): HTMLElement {
    const root = document.createElement("div");
    for (const index of indexes) {
      const el = document.createElement("div");
      if (index !== null) el.setAttribute("data-index", String(index));
      root.appendChild(el);
    }
    return root;
  }

  it("tracks the elements bound to indexes", () => {
    const onBind = vi.fn();
    const onUnbind = vi.fn();
    const track = createItemTracker({ onBind, onUnbind });
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
    const track = createItemTracker({ onUnbind });
    const root = createRoot([0]);

    track(root);
    root.firstElementChild!.remove();
    track(root);
    expect(onUnbind.mock.calls).toEqual([[0]]);
  });
});
