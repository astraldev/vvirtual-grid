import type { ResizeMeasurement } from "./pipeline";

/** A rectangle in CSS pixels. */
export interface ItemRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Zero-based visual cell of an item. */
export interface ItemCell {
  row: number;
  column: number;
}

/** Total number of visual rows and columns of the whole list. */
export interface GridDimensions {
  rowCount: number;
  columnCount: number;
}

/** The subset of the grid measurement needed to locate an item. */
export type ItemLayout = Pick<
  ResizeMeasurement,
  | "flow"
  | "columns"
  | "rows"
  | "colGap"
  | "rowGap"
  | "itemWidthWithGap"
  | "itemHeightWithGap"
>;

type Tracks = Pick<ItemLayout, "flow" | "columns" | "rows">;

/**
 * Writes the rectangle of an item into `out`, from its index alone, so it
 * works for items that are not rendered. Coordinates are relative to the
 * top-left corner of the first item (index 0). Does not allocate.
 */
export function getItemRectByIndex<R extends ItemRect>(
  index: number,
  layout: ItemLayout,
  out: R,
): R {
  if (layout.flow === "row") {
    out.x = (index % layout.columns) * layout.itemWidthWithGap;
    out.y = Math.floor(index / layout.columns) * layout.itemHeightWithGap;
  } else {
    out.x = Math.floor(index / layout.rows) * layout.itemWidthWithGap;
    out.y = (index % layout.rows) * layout.itemHeightWithGap;
  }
  out.width = layout.itemWidthWithGap - layout.colGap;
  out.height = layout.itemHeightWithGap - layout.rowGap;

  return out;
}

/** Writes the zero-based visual row and column of an item into `out`. */
export function getItemCellByIndex<C extends ItemCell>(
  index: number,
  tracks: Tracks,
  out: C,
): C {
  if (tracks.flow === "row") {
    out.row = Math.floor(index / tracks.columns);
    out.column = index % tracks.columns;
  } else {
    out.row = index % tracks.rows;
    out.column = Math.floor(index / tracks.rows);
  }

  return out;
}

/**
 * The index of the item at a zero-based visual row and column. The result is
 * not checked against the length of the list.
 */
export function getIndexByCell(
  row: number,
  column: number,
  tracks: Tracks,
): number {
  return tracks.flow === "row"
    ? row * tracks.columns + column
    : column * tracks.rows + row;
}

/** Writes the total number of visual rows and columns of the list into `out`. */
export function getGridDimensions<D extends GridDimensions>(
  length: number,
  tracks: Tracks,
  out: D,
): D {
  if (tracks.flow === "row") {
    out.rowCount = Math.ceil(length / tracks.columns);
    out.columnCount = Math.min(tracks.columns, length);
  } else {
    out.rowCount = Math.min(tracks.rows, length);
    out.columnCount = Math.ceil(length / tracks.rows);
  }

  return out;
}
