// Standalone, dependency-free building blocks. Nothing in the grid imports
// this module, so bundlers drop whatever you do not use.
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
 * Arguments of the primitives. Each function takes one object, so you can
 * create it once, change `index` (or `target`) and call again without
 * allocating.
 */
export interface ItemRectArgs<R extends ItemRect = ItemRect> {
  /** Zero-based index of the item. Not checked against the list length. */
  index: number;
  /** The grid's exposed `measurement`. */
  layout: ItemLayout;
  /** Object the result is written into. */
  out: R;
}

export interface ItemViewportRectArgs<
  R extends ItemRect = ItemRect,
> extends ItemRectArgs<R> {
  /** The grid element, `gridRef.value.$el`. */
  root: Element;
}

export interface ItemCellArgs<C extends ItemCell = ItemCell> {
  index: number;
  layout: Tracks;
  out: C;
}

export interface IndexByCellArgs {
  row: number;
  column: number;
  layout: Tracks;
}

export interface GridDimensionsArgs<D extends GridDimensions = GridDimensions> {
  /** Total number of items, the grid's `length` prop. */
  length: number;
  layout: Tracks;
  out: D;
}

export interface ItemElementArgs {
  root: Element;
  index: number;
}

export interface ItemIndexArgs {
  root: Element;
  /** An element inside an item, such as `event.target`. */
  target: EventTarget | null;
}

export interface ItemTrackerCallbacks {
  /** An element started rendering `index`. */
  onBind?: (index: number, element: HTMLElement) => void;
  /** No element renders `index` any more. */
  onUnbind?: (index: number) => void;
}

/**
 * Writes the rectangle of an item into `out`, from its index alone, so it
 * works for items that are not rendered. Coordinates are relative to the
 * top-left corner of the first item (index 0). Does not allocate.
 */
export function getItemRectByIndex<R extends ItemRect>({
  index,
  layout,
  out,
}: ItemRectArgs<R>): R {
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
export function getItemCellByIndex<C extends ItemCell>({
  index,
  layout,
  out,
}: ItemCellArgs<C>): C {
  if (layout.flow === "row") {
    out.row = Math.floor(index / layout.columns);
    out.column = index % layout.columns;
  } else {
    out.row = index % layout.rows;
    out.column = Math.floor(index / layout.rows);
  }

  return out;
}

/**
 * The index of the item at a zero-based visual row and column. The result is
 * not checked against the length of the list.
 */
export function getIndexByCell({
  row,
  column,
  layout,
}: IndexByCellArgs): number {
  return layout.flow === "row"
    ? row * layout.columns + column
    : column * layout.rows + row;
}

/** Writes the total number of visual rows and columns of the list into `out`. */
export function getGridDimensions<D extends GridDimensions>({
  length,
  layout,
  out,
}: GridDimensionsArgs<D>): D {
  if (layout.flow === "row") {
    out.rowCount = Math.ceil(length / layout.columns);
    out.columnCount = Math.min(layout.columns, length);
  } else {
    out.rowCount = Math.min(layout.rows, length);
    out.columnCount = Math.ceil(length / layout.rows);
  }

  return out;
}

/**
 * Writes the rectangle of an item relative to the viewport into `out`, like
 * `getBoundingClientRect()` would, whether the item is rendered or not.
 * Reads the layout once and returns `false`, leaving `out` untouched, when
 * the grid has nothing rendered.
 */
export function getItemViewportRect<R extends ItemRect>(
  args: ItemViewportRectArgs<R>,
): boolean {
  // the first child always sits, untranslated, in the cell of the first item
  const first = args.root.firstElementChild;
  if (first === null) return false;

  const origin = first.getBoundingClientRect();
  const out = getItemRectByIndex(args);
  out.x += origin.left;
  out.y += origin.top;

  return true;
}

function readIndex(element: Element): number {
  const value = element.getAttribute("data-index");
  if (value === null || value === "") return -1;

  const index = Number(value);
  return Number.isInteger(index) ? index : -1;
}

/**
 * The element currently rendering an item, or `null` when it is virtualized.
 * Only the elements that the slots mark with `data-index` can be found.
 */
export function getItemElement({
  root,
  index,
}: ItemElementArgs): HTMLElement | null {
  for (let el = root.firstElementChild; el; el = el.nextElementSibling) {
    if (readIndex(el) === index) return el as HTMLElement;
  }

  return null;
}

/**
 * The index of the item rendered by, or around, an element such as
 * `event.target`. Returns -1 when the element is not part of a marked item.
 */
export function getItemIndex({ root, target }: ItemIndexArgs): number {
  let node = target as Element | null;
  if (node === null || typeof node.getAttribute !== "function") return -1;

  while (node !== null && node.parentElement !== root) {
    node = node.parentElement;
  }

  return node === null ? -1 : readIndex(node);
}

/**
 * Creates a function that reports which marked elements started and stopped
 * rendering an item since it was last called. Call it with the element of the
 * grid from the `onRender` callback. It keeps two maps and swaps them, so
 * calling it does not allocate.
 *
 * `onBind` is also called when another element takes over an index, e.g. when
 * a placeholder is replaced by the loaded item.
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
