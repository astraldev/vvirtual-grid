import { describe, it, expect } from "vitest";
import {
  getGridDimensions,
  getIndexByCell,
  getItemCellByIndex,
  getItemRectByIndex,
  type ItemLayout,
} from "../src/position";
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
