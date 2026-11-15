// Standalone, dependency-free building blocks. Nothing in the grid imports
// this module, so bundlers drop whatever you do not use.
import type { ResizeMeasurement } from "./pipeline";

/**
 * A rectangle in CSS pixels. It has the fields of `DOMRect`, so it can stand
 * in for `getBoundingClientRect()`, e.g. in a Floating UI virtual element.
 */
export interface ItemRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Zero-based visual row and column of an item. */
export interface ItemCell {
  row: number;
  column: number;
}

/** The part of the grid's exposed `measurement` the primitives read. */
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

/**
 * Input and output of `getItemRect`. Create it once with `createRectQuery`,
 * then change `index` and call again. The result is written into `rect`, so
 * a call creates no object.
 */
export interface RectQuery {
  /** Zero-based index of the item. Not checked against the list length. */
  index: number;
  /** The grid's exposed `measurement`. */
  layout: ItemLayout | undefined;
  /**
   * The grid element. When set, `rect` is relative to the viewport, like
   * `getBoundingClientRect()`. When `null`, it is relative to item 0.
   */
  root: Element | null;
  /** Written by `getItemRect`. */
  rect: ItemRect;
}

/**
 * Input and output of `getItemCell` and `getIndexByCell`. Create it once with
 * `createCellQuery`. `getItemCell` reads `index` and writes `cell`.
 * `getIndexByCell` reads `cell` and returns the index.
 */
export interface CellQuery {
  index: number;
  layout: ItemLayout | undefined;
  cell: ItemCell;
}

export interface ItemTrackerCallbacks {
  /** An element started rendering `index`. */
  onBind?: (index: number, element: HTMLElement) => void;
  /** No element renders `index` any more. */
  onUnbind?: (index: number) => void;
}

/** Creates a reusable `RectQuery`. */
export function createRectQuery(
  init: Partial<Omit<RectQuery, "rect">> = {},
): RectQuery {
  return {
    index: init.index ?? 0,
    layout: init.layout,
    root: init.root ?? null,
    rect: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };
}

/** Creates a reusable `CellQuery`. */
export function createCellQuery(
  init: Partial<Omit<CellQuery, "cell">> = {},
): CellQuery {
  return {
    index: init.index ?? 0,
    layout: init.layout,
    cell: { row: 0, column: 0 },
  };
}

/**
 * Writes the rectangle of `query.index` into `query.rect`, whether the item is
 * rendered or not. Without `root` the rectangle is relative to item 0 and no
 * DOM is read. With `root` it is relative to the viewport, which reads the
 * layout of one element. Returns `false`, leaving `rect` untouched, when
 * `layout` is missing or the grid has nothing rendered.
 */
export function getItemRect(query: RectQuery): boolean {
  const { index, layout, root, rect } = query;
  if (layout === undefined) return false;

  let x: number;
  let y: number;
  if (layout.flow === "row") {
    x = (index % layout.columns) * layout.itemWidthWithGap;
    y = Math.floor(index / layout.columns) * layout.itemHeightWithGap;
  } else {
    x = Math.floor(index / layout.rows) * layout.itemWidthWithGap;
    y = (index % layout.rows) * layout.itemHeightWithGap;
  }

  if (root !== null) {
    // the first child always sits, untranslated, in the cell of item 0
    const first = root.firstElementChild;
    if (first === null) return false;
    const origin = first.getBoundingClientRect();
    x += origin.left;
    y += origin.top;
  }

  const width = layout.itemWidthWithGap - layout.colGap;
  const height = layout.itemHeightWithGap - layout.rowGap;
  rect.x = rect.left = x;
  rect.y = rect.top = y;
  rect.width = width;
  rect.height = height;
  rect.right = x + width;
  rect.bottom = y + height;

  return true;
}

/**
 * Writes the zero-based row and column of `query.index` into `query.cell`.
 * Returns `false` when `layout` is missing.
 */
export function getItemCell(query: CellQuery): boolean {
  const { index, layout, cell } = query;
  if (layout === undefined) return false;

  if (layout.flow === "row") {
    cell.row = Math.floor(index / layout.columns);
    cell.column = index % layout.columns;
  } else {
    cell.row = index % layout.rows;
    cell.column = Math.floor(index / layout.rows);
  }

  return true;
}

/**
 * The index of the item at `query.cell`. Returns -1 when `layout` is missing.
 * The result is not checked against the list length.
 */
export function getIndexByCell(query: CellQuery): number {
  const { layout, cell } = query;
  if (layout === undefined) return -1;

  return layout.flow === "row"
    ? cell.row * layout.columns + cell.column
    : cell.column * layout.rows + cell.row;
}

function readIndex(element: Element): number {
  const value = element.getAttribute("data-index");
  if (value === null || value === "") return -1;

  const index = Number(value);
  return Number.isInteger(index) ? index : -1;
}

/**
 * Creates a function that reports which elements marked with `data-index`
 * started and stopped rendering an item since it was last called. Call it
 * with the grid element on the grid's `render` event. It keeps two maps and
 * swaps them, so a call creates no object.
 *
 * `onBind` also fires when another element takes over an index, e.g. when a
 * loaded item replaces its placeholder.
 */
export function createItemTracker({
  onBind,
  onUnbind,
}: ItemTrackerCallbacks): (root: Element) => void {
  let bound = new Map<number, Element>();
  let next = new Map<number, Element>();

  const reportUnbound = (_element: Element, index: number) => {
    if (!next.has(index)) onUnbind!(index);
  };

  return (root) => {
    for (let el = root.firstElementChild; el; el = el.nextElementSibling) {
      const index = readIndex(el);
      if (index === -1) continue;

      next.set(index, el);
      if (onBind !== undefined && bound.get(index) !== el) {
        onBind(index, el as HTMLElement);
      }
    }
    if (onUnbind !== undefined) bound.forEach(reportUnbound);

    const previous = bound;
    bound = next;
    next = previous;
    next.clear(); // do not keep removed elements alive
  };
}
