import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  merge,
  mergeMap,
  Observable,
  range,
  scan,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs";
import { getElementScrollParents } from "./utilites";

interface SpaceBehindWindow {
  width: number;
  height: number;
}

export function computeSpaceBehindWindowOf(el: Element): SpaceBehindWindow {
  const { left, top } = el.getBoundingClientRect();

  return {
    width: Math.abs(Math.min(left, 0)),
    height: Math.abs(Math.min(top, 0)),
  };
}

export interface GridMeasurement {
  colGap: number;
  rowGap: number;
  flow: "row" | "column";
  columns: number;
  rows: number;
}

export function getGridMeasurement(rootEl: Element): GridMeasurement {
  const computedStyle = window.getComputedStyle(rootEl);

  return {
    rowGap: parseInt(computedStyle.getPropertyValue("row-gap")) || 0,
    colGap: parseInt(computedStyle.getPropertyValue("column-gap")) || 0,
    flow: computedStyle.getPropertyValue("grid-auto-flow").startsWith("column")
      ? "column"
      : "row",
    columns: computedStyle.getPropertyValue("grid-template-columns").split(" ")
      .length,
    rows: computedStyle.getPropertyValue("grid-template-rows").split(" ")
      .length,
  };
}

export interface ResizeMeasurement extends GridMeasurement {
  itemHeightWithGap: number;
  itemWidthWithGap: number;
}

export function getResizeMeasurement(
  rootEl: Element,
  { height, width }: DOMRectReadOnly,
): ResizeMeasurement {
  const { colGap, rowGap, flow, columns, rows } = getGridMeasurement(rootEl);

  return {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemHeightWithGap: height + rowGap,
    itemWidthWithGap: width + colGap,
  };
}

interface BufferMeta {
  bufferedOffset: number;
  bufferedLength: number;
}

/** Uncurried `getBufferMeta`, so the scroll path does not create a closure per event. */
export function computeBufferMeta(
  { width: widthBehindWindow, height: heightBehindWindow }: SpaceBehindWindow,
  {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemHeightWithGap,
    itemWidthWithGap,
  }: ResizeMeasurement,
  windowInnerWidth: number,
  windowInnerHeight: number,
): BufferMeta {
  let crosswiseLines;
  let gap;
  let itemSizeWithGap;
  let windowInnerSize;
  let spaceBehindWindow;
  if (flow === "row") {
    crosswiseLines = columns;
    gap = rowGap;
    itemSizeWithGap = itemHeightWithGap;
    windowInnerSize = windowInnerHeight;
    spaceBehindWindow = heightBehindWindow;
  } else {
    crosswiseLines = rows;
    gap = colGap;
    itemSizeWithGap = itemWidthWithGap;
    windowInnerSize = windowInnerWidth;
    spaceBehindWindow = widthBehindWindow;
  }

  const linesInView =
    itemSizeWithGap && Math.ceil((windowInnerSize + gap) / itemSizeWithGap) + 1;
  const length = linesInView * crosswiseLines;

  const linesBeforeView =
    itemSizeWithGap && Math.floor((spaceBehindWindow + gap) / itemSizeWithGap);
  const offset = linesBeforeView * crosswiseLines;
  const bufferedOffset = Math.max(offset - Math.floor(length / 2), 0);
  const bufferedLength = length * 2;

  return {
    bufferedOffset,
    bufferedLength,
  };
}

export const getBufferMeta =
  (
    windowInnerWidth: number = window.innerWidth,
    windowInnerHeight: number = window.innerHeight,
  ) =>
  (
    spaceBehindWindow: SpaceBehindWindow,
    resizeMeasurement: ResizeMeasurement,
  ): BufferMeta =>
    computeBufferMeta(
      spaceBehindWindow,
      resizeMeasurement,
      windowInnerWidth,
      windowInnerHeight,
    );

function isSameSpaceBehindWindow(
  a: SpaceBehindWindow,
  b: SpaceBehindWindow,
): boolean {
  return a.width === b.width && a.height === b.height;
}

function isSameBufferMeta(a: BufferMeta, b: BufferMeta): boolean {
  return (
    a.bufferedOffset === b.bufferedOffset &&
    a.bufferedLength === b.bufferedLength
  );
}

export function getObservableOfVisiblePageNumbers(
  { bufferedOffset, bufferedLength }: BufferMeta,
  length: number,
  pageSize: number,
): Observable<number> {
  const startPage = Math.floor(bufferedOffset / pageSize);
  const endPage = Math.ceil(
    Math.min(bufferedOffset + bufferedLength, length) / pageSize,
  );
  const numberOfPages = endPage - startPage;

  return range(startPage, numberOfPages);
}

interface ItemsByPage {
  pageNumber: number;
  items: unknown[];
  pageSize: number;
}

export type PageProvider<T = unknown> = (
  pageNumber: number,
  pageSize: number,
) => Promise<T[]> | T[];

export function callPageProvider(
  pageNumber: number,
  pageSize: number,
  pageProvider: PageProvider,
): Promise<ItemsByPage> {
  return Promise.resolve(pageProvider(pageNumber, pageSize)).then((items) => ({
    pageNumber,
    items,
    pageSize,
  }));
}

export function accumulateAllItems(
  allItems: unknown[],
  [{ pageNumber, items, pageSize }, length]: [ItemsByPage, number],
): unknown[] {
  // Update length if necessary in memory
  if (allItems.length !== length) {
    allItems.length = length;
  }

  const start = pageNumber * pageSize;
  const end = Math.min(start + pageSize, length);

  for (let i = start; i < end; i++) {
    const localIndex = i - start;
    allItems[i] = localIndex < items.length ? items[localIndex] : undefined;
  }

  return allItems;
}

/** The loaded pages. Items of pages that were not requested are `undefined`. */
export interface ItemStore {
  length: number;
  pageSize: number;
  pages: Map<number, unknown[]>;
}

export function createItemStore(): ItemStore {
  return { length: 0, pageSize: 1, pages: new Map() };
}

export function accumulateItemStore(
  store: ItemStore,
  [{ pageNumber, items, pageSize }, length]: [ItemsByPage, number],
): ItemStore {
  // pages of another size hold other items under the same page number
  if (store.pageSize !== pageSize) {
    store.pages.clear();
    store.pageSize = pageSize;
  }

  store.length = length;
  store.pages.set(pageNumber, items);

  return store;
}

interface ItemOffset {
  x: number;
  y: number;
}

export function getItemOffsetByIndex(
  index: number,
  {
    flow,
    columns,
    rows,
    itemWidthWithGap,
    itemHeightWithGap,
  }: ResizeMeasurement,
): ItemOffset {
  let x;
  let y;
  if (flow === "row") {
    x = (index % columns) * itemWidthWithGap;
    y = Math.floor(index / columns) * itemHeightWithGap;
  } else {
    x = Math.floor(index / rows) * itemWidthWithGap;
    y = (index % rows) * itemHeightWithGap;
  }

  return { x, y };
}

export interface InternalItem<T = unknown> {
  index: number;
  value: T | undefined;
  style?: { transform: string; gridArea: string };
}

function createInternalItem(
  index: number,
  value: unknown,
  resizeMeasurement: ResizeMeasurement,
): InternalItem {
  let x;
  let y;
  if (resizeMeasurement.flow === "row") {
    x =
      (index % resizeMeasurement.columns) * resizeMeasurement.itemWidthWithGap;
    y =
      Math.floor(index / resizeMeasurement.columns) *
      resizeMeasurement.itemHeightWithGap;
  } else {
    x =
      Math.floor(index / resizeMeasurement.rows) *
      resizeMeasurement.itemWidthWithGap;
    y = (index % resizeMeasurement.rows) * resizeMeasurement.itemHeightWithGap;
  }

  return {
    index,
    value,
    style: {
      gridArea: "1/1",
      transform: `translate(${x}px, ${y}px)`,
    },
  };
}

export function getVisibleItems(
  { bufferedOffset, bufferedLength }: BufferMeta,
  resizeMeasurement: ResizeMeasurement,
  allItems: unknown[],
): InternalItem[] {
  const start = Math.min(bufferedOffset, allItems.length);
  const end = Math.min(bufferedOffset + bufferedLength, allItems.length);
  const items: InternalItem[] = [];

  for (let index = start; index < end; index++) {
    items.push(createInternalItem(index, allItems[index], resizeMeasurement));
  }

  return items;
}

/**
 * Creates a `getVisibleItems` that remembers its last result. Items whose
 * value and position did not change are handed out again instead of being
 * created again, and the very same array is returned when nothing changed.
 */
export function createVisibleItemsGetter(): (
  bufferMeta: BufferMeta,
  resizeMeasurement: ResizeMeasurement,
  store: ItemStore,
) => InternalItem[] {
  let previousItems: InternalItem[] = [];
  let previousStart = 0;
  let previousMeasurement: ResizeMeasurement | undefined;

  return ({ bufferedOffset, bufferedLength }, resizeMeasurement, store) => {
    const { pages, pageSize } = store;
    const start = Math.min(bufferedOffset, store.length);
    const end = Math.min(bufferedOffset + bufferedLength, store.length);
    const previousEnd = previousStart + previousItems.length;
    const canReuse =
      previousMeasurement !== undefined &&
      (previousMeasurement === resizeMeasurement ||
        (previousMeasurement.flow === resizeMeasurement.flow &&
          previousMeasurement.columns === resizeMeasurement.columns &&
          previousMeasurement.rows === resizeMeasurement.rows &&
          previousMeasurement.itemWidthWithGap ===
            resizeMeasurement.itemWidthWithGap &&
          previousMeasurement.itemHeightWithGap ===
            resizeMeasurement.itemHeightWithGap));

    let items: InternalItem[] | undefined;
    // stays undefined for as long as the result equals the previous one
    if (!canReuse || start !== previousStart || end !== previousEnd) {
      items = [];
    }

    // the window spans few pages, so look a page up once and not once per item
    let pageNumber = -1;
    let page: unknown[] | undefined;
    let pageStart = 0;

    for (let index = start; index < end; index++) {
      if (index >= pageStart + pageSize || pageNumber === -1) {
        pageNumber = Math.floor(index / pageSize);
        pageStart = pageNumber * pageSize;
        page = pages.get(pageNumber);
      }
      const value = page === undefined ? undefined : page[index - pageStart];
      const previous =
        canReuse && index >= previousStart && index < previousEnd
          ? previousItems[index - previousStart]!
          : undefined;

      if (previous !== undefined && previous.value === value) {
        if (items !== undefined) items.push(previous);
        continue;
      }

      if (items === undefined) items = previousItems.slice(0, index - start);
      items.push(createInternalItem(index, value, resizeMeasurement));
    }

    previousMeasurement = resizeMeasurement;
    if (items === undefined) return previousItems;

    previousItems = items;
    previousStart = start;
    return items;
  };
}

/** Returns a unique, stable identifier of an item, e.g. its database id. */
export type GetItemId = (item: any) => unknown;

function isSameResizeMeasurement(
  a: ResizeMeasurement,
  b: ResizeMeasurement,
): boolean {
  return (
    a.flow === b.flow &&
    a.columns === b.columns &&
    a.rows === b.rows &&
    a.colGap === b.colGap &&
    a.rowGap === b.rowGap &&
    a.itemWidthWithGap === b.itemWidthWithGap &&
    a.itemHeightWithGap === b.itemHeightWithGap
  );
}

function isSameInternalItem(
  a: InternalItem,
  b: InternalItem,
  getItemId: GetItemId | undefined,
): boolean {
  if (a === b) return true;
  if (a.index !== b.index) return false;

  const styleA = a.style;
  const styleB = b.style;
  if (
    styleA !== styleB &&
    (styleA === undefined ||
      styleB === undefined ||
      styleA.transform !== styleB.transform ||
      styleA.gridArea !== styleB.gridArea)
  ) {
    return false;
  }

  if (a.value === b.value) return true;

  // a page loaded again gives new objects for the same items
  return (
    getItemId !== undefined &&
    a.value != null &&
    b.value != null &&
    getItemId(a.value) === getItemId(b.value)
  );
}

/**
 * Merges the visible items into the rendered buffer. An item is kept as it is
 * when its position and value are the same. Values are the same when they are
 * the same object, or when `getItemId` returns the same identifier for both.
 */
export function accumulateBuffer(
  buffer: InternalItem[],
  visibleItems: InternalItem[],
  getItemId?: GetItemId,
): InternalItem[] {
  const bufferByIndex = new Map<number, InternalItem>();
  for (let i = 0; i < buffer.length; i++) {
    bufferByIndex.set(buffer[i]!.index, buffer[i]!);
  }

  const visibleByIndex = new Map<number, InternalItem>();
  // visible items that are not in the buffer yet, or differ from the buffered one
  const itemsToAdd: InternalItem[] = [];
  for (let i = 0; i < visibleItems.length; i++) {
    let item = visibleItems[i]!;
    const buffered = bufferByIndex.get(item.index);

    // Don't downgrade a loaded item to a placeholder — transient undefined emissions
    // from itemStore$ (e.g. when page size changes before the new page has loaded).
    if (
      item.value === undefined &&
      buffered !== undefined &&
      buffered.value !== undefined
    ) {
      item = buffered;
    }

    visibleByIndex.set(item.index, item);
    if (
      buffered === undefined ||
      !isSameInternalItem(buffered, item, getItemId)
    ) {
      itemsToAdd.push(item);
    }
  }

  // Buffered items that are no longer visible are free to use: they are
  // replaced in place by the items to add, and deleted when none is left.
  let result: InternalItem[] | undefined;
  let added = 0;
  for (let i = 0; i < buffer.length; i++) {
    const item = buffer[i]!;
    const visible = visibleByIndex.get(item.index);

    if (visible !== undefined && isSameInternalItem(visible, item, getItemId)) {
      if (result !== undefined) result.push(item);
      continue;
    }

    if (result === undefined) result = buffer.slice(0, i);
    if (added < itemsToAdd.length) result.push(itemsToAdd[added++]!);
  }

  // nothing changed, keep the same array so that nothing renders again
  if (result === undefined && added === itemsToAdd.length) return buffer;

  if (result === undefined) result = buffer.slice();
  for (; added < itemsToAdd.length; added++) result.push(itemsToAdd[added]!);

  return result;
}

interface ContentSize {
  width?: number;
  height?: number;
}

export function getContentSize(
  {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemWidthWithGap,
    itemHeightWithGap,
  }: ResizeMeasurement,
  length: number,
): ContentSize {
  return flow === "row"
    ? { height: itemHeightWithGap * Math.ceil(length / columns) - rowGap }
    : { width: itemWidthWithGap * Math.ceil(length / rows) - colGap };
}

interface PipelineInput {
  length$: Observable<number>;
  pageProvider$: Observable<PageProvider>;
  pageProviderDebounceTime$: Observable<number>;
  pageSize$: Observable<number>;
  itemRect$: Observable<DOMRectReadOnly>;
  rootResize$: Observable<Element>;
  scroll$: Observable<Element>;
  respectScrollToOnResize$: Observable<boolean>;
  scrollTo$: Observable<number | undefined>;
  /**
   * Tells whether an item loaded again is the same item. Without it, only
   * the very same object counts as the same item.
   */
  getItemId$?: Observable<GetItemId | undefined>;
}

export type ScrollAction = {
  target: Element;
  top: number;
  left: number;
};

interface PipelineOutput {
  buffer$: Observable<InternalItem[]>;
  contentSize$: Observable<ContentSize>;
  scrollAction$: Observable<ScrollAction>;
  ready$: Observable<boolean>;
  /** The latest measurement of the grid, emits when the item size or grid tracks change. */
  measurement$: Observable<ResizeMeasurement>;
  recompute: () => Promise<void>;
}

type AsyncPipelineOutput = Promise<PipelineOutput>;

export async function pipeline({
  length$,
  pageProvider$,
  pageProviderDebounceTime$,
  pageSize$,
  itemRect$,
  rootResize$,
  scroll$,
  respectScrollToOnResize$,
  scrollTo$,
  getItemId$ = new BehaviorSubject<GetItemId | undefined>(undefined),
}: PipelineInput): AsyncPipelineOutput {
  // Fetch the first page for SSR before setting up the reactive pipeline
  const [ssrPageProvider, ssrPageSize] = await Promise.all([
    firstValueFrom(pageProvider$),
    firstValueFrom(pageSize$),
  ]);

  const manualRecompute$ = new BehaviorSubject(0);
  const { items: ssrPageItems } = await callPageProvider(
    0,
    ssrPageSize,
    ssrPageProvider,
  );
  // region: measurements of the visual grid
  const spaceBehindWindow$: Observable<SpaceBehindWindow> = merge(
    rootResize$,
    scroll$,
  ).pipe(
    map(computeSpaceBehindWindowOf),
    distinctUntilChanged(isSameSpaceBehindWindow),
  );

  const resizeMeasurement$: Observable<ResizeMeasurement> = combineLatest(
    [rootResize$, itemRect$],
    getResizeMeasurement,
  ).pipe(
    distinctUntilChanged(isSameResizeMeasurement),
    // measure once for all consumers instead of once per consumer
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  const contentSize$: Observable<ContentSize> = combineLatest(
    [resizeMeasurement$, length$],
    getContentSize,
  );
  // endregion

  // region: scroll to a given item by index
  const scrollToNotNil$: Observable<number> = scrollTo$.pipe(
    filter((scrollTo): scrollTo is number => scrollTo != null),
  );
  const scrollAction$: Observable<ScrollAction> = respectScrollToOnResize$.pipe(
    switchMap((respectScrollToOnResize) =>
      respectScrollToOnResize
        ? // Emit when any input stream emits
          combineLatest<[number, ResizeMeasurement, Element]>([
            scrollToNotNil$,
            resizeMeasurement$,
            rootResize$,
          ])
        : // Emit only when the source stream emmits
          scrollToNotNil$.pipe(
            withLatestFrom<number, [ResizeMeasurement, Element]>(
              resizeMeasurement$,
              rootResize$,
            ),
          ),
    ),
    map<[number, ResizeMeasurement, Element], ScrollAction>(
      ([scrollTo, resizeMeasurement, rootEl]) => {
        const { vertical: verticalScrollEl, horizontal: horizontalScrollEl } =
          getElementScrollParents(rootEl);
        const computedStyle = getComputedStyle(rootEl);

        const gridPaddingTop = parseInt(
          computedStyle.getPropertyValue("padding-top"),
        );
        const gridBoarderTop = parseInt(
          computedStyle.getPropertyValue("border-top"),
        );

        const gridPaddingLeft = parseInt(
          computedStyle.getPropertyValue("padding-left"),
        );
        const gridBoarderLeft = parseInt(
          computedStyle.getPropertyValue("border-left"),
        );

        const leftToGridContainer =
          rootEl instanceof HTMLElement &&
          horizontalScrollEl instanceof HTMLElement
            ? rootEl.offsetLeft - horizontalScrollEl.offsetLeft
            : 0;

        const topToGridContainer =
          rootEl instanceof HTMLElement &&
          verticalScrollEl instanceof HTMLElement
            ? rootEl.offsetTop - verticalScrollEl.offsetTop
            : 0;

        const { x, y } = getItemOffsetByIndex(scrollTo, resizeMeasurement);

        return {
          target: verticalScrollEl,
          top: y + topToGridContainer + gridPaddingTop + gridBoarderTop,
          left: x + leftToGridContainer + gridPaddingLeft + gridBoarderLeft,
        };
      },
    ),
  );
  // endregion

  // region: rendering buffer
  const bufferMeta$: Observable<BufferMeta> = combineLatest([
    spaceBehindWindow$,
    resizeMeasurement$,
  ]).pipe(
    map(([space, resize]) =>
      computeBufferMeta(space, resize, window.innerWidth, window.innerHeight),
    ),
    distinctUntilChanged(isSameBufferMeta),
    shareReplay(1),
  );

  const visiblePageNumbers$: Observable<Observable<number>> = combineLatest([
    bufferMeta$,
    length$,
    pageSize$,
  ]).pipe(
    map(([bufferMeta, length, pageSize]) =>
      getObservableOfVisiblePageNumbers(bufferMeta, length, pageSize),
    ),
  );

  const debouncedVisiblePageNumbers$: Observable<Observable<number>> =
    pageProviderDebounceTime$.pipe(
      switchMap((time) =>
        time === 0
          ? visiblePageNumbers$
          : visiblePageNumbers$.pipe(debounceTime(time)),
      ),
    );

  const memorizedPageProvider$: Observable<
    (
      pageNumber: number,
      pageSize: number,
      version: number,
    ) => Promise<unknown[]> | unknown[]
  > = combineLatest([pageProvider$, length$.pipe(distinctUntilChanged())]).pipe(
    // a new provider or length starts a fresh memo
    map(([f]) => {
      const pages = new Map<string, Promise<unknown[]> | unknown[]>();

      return (pageNumber: number, pageSize: number, version: number) => {
        const key = `${pageNumber},${pageSize},${version}`;
        let page = pages.get(key);
        if (page === undefined) {
          page = f(pageNumber, pageSize);
          pages.set(key, page);
        }
        return page;
      };
    }),
    shareReplay(1),
  );

  const itemsByPage$: Observable<ItemsByPage> = manualRecompute$.pipe(
    switchMap((version) =>
      combineLatest([
        debouncedVisiblePageNumbers$,
        pageSize$,
        memorizedPageProvider$,
      ]).pipe(
        mergeMap(([pageNumber$, pageSize, memorizedPageProvider]) => {
          return pageNumber$.pipe(
            mergeMap<number, Promise<ItemsByPage>>((pageNumber) =>
              callPageProvider(pageNumber, pageSize, (p, s) =>
                memorizedPageProvider(p, s, version),
              ),
            ),
          );
        }),
      ),
    ),
    shareReplay<ItemsByPage>(1),
  );

  const replayLength$: Observable<number> = length$.pipe(shareReplay(1));

  const itemStore$: Observable<ItemStore> = memorizedPageProvider$.pipe(
    switchMap(() =>
      combineLatest([itemsByPage$, replayLength$]).pipe(
        scan(accumulateItemStore, createItemStore()),
      ),
    ),
    shareReplay(1),
  );

  const ssrBuffer: InternalItem[] = ssrPageItems.map((value, index) => ({
    index,
    value,
    style: undefined,
  }));

  const domItems$: Observable<InternalItem[]> = combineLatest(
    [bufferMeta$, resizeMeasurement$, itemStore$],
    createVisibleItemsGetter(),
  );

  const buffer$: Observable<InternalItem[]> = getItemId$.pipe(
    switchMap((getItemId) =>
      domItems$.pipe(
        scan<InternalItem[], InternalItem[]>(
          (buffer, visibleItems) =>
            accumulateBuffer(buffer, visibleItems, getItemId),
          [],
        ),
      ),
    ),
    startWith(ssrBuffer),
  );

  const ready$: Observable<boolean> = merge(
    manualRecompute$.pipe(map(() => false)),
    domItems$.pipe(map(() => true)),
  ).pipe(distinctUntilChanged(), shareReplay(1));

  async function recompute() {
    manualRecompute$.next(manualRecompute$.value + 1);
    await firstValueFrom(ready$.pipe(filter((v) => v === true)));
  }

  return {
    buffer$,
    contentSize$,
    scrollAction$,
    ready$,
    measurement$: resizeMeasurement$,
    recompute,
  };
}
