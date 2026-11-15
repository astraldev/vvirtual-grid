import { bench, describe } from "vitest";
import { BehaviorSubject, of, Subject } from "rxjs";
import {
  accumulateBuffer,
  getBufferMeta,
  getVisibleItems,
  pipeline,
  type InternalItem,
} from "../src/pipeline";
import { createPageProvider } from "../src";

// 10 columns of 100px x 100px items in a 1024px x 768px window
const measurement = {
  colGap: 0,
  rowGap: 0,
  flow: "row" as const,
  columns: 10,
  rows: 1,
  itemHeightWithGap: 100,
  itemWidthWithGap: 100,
};
const length = 1_000_000;
const allItems: unknown[] = Array.from({ length }, (_, i) => ({ id: i }));
const LINES = 20;
const options = { time: 1000, warmupTime: 200 };

describe("scroll hot path", () => {
  // what runs each time the window moves by one line of items
  bench(
    `buffer update, ${LINES} lines scrolled one at a time`,
    () => {
      let buffer: InternalItem[] = [];
      for (let line = 0; line < LINES; line++) {
        const meta = getBufferMeta(1024, 768)(
          { width: 0, height: 5000 + line * 100 },
          measurement,
        );
        buffer = accumulateBuffer(
          buffer,
          getVisibleItems(meta, measurement, allItems),
        );
      }
    },
    options,
  );

  // what runs for scroll events that do not move the window by a whole line
  bench(
    `buffer update, ${LINES} scroll events within one line`,
    () => {
      let buffer: InternalItem[] = [];
      for (let step = 0; step < LINES; step++) {
        const meta = getBufferMeta(1024, 768)(
          { width: 0, height: 5000 + (step % 50) },
          measurement,
        );
        buffer = accumulateBuffer(
          buffer,
          getVisibleItems(meta, measurement, allItems),
        );
      }
    },
    options,
  );
});

describe("pipeline scroll", async () => {
  Object.defineProperty(window, "innerWidth", { value: 1024 });
  Object.defineProperty(window, "innerHeight", { value: 768 });

  const root = document.createElement("div");
  root.style.setProperty("grid-auto-flow", "row");
  root.style.setProperty(
    "grid-template-columns",
    Array(10).fill("100px").join(" "),
  );
  root.style.setProperty("grid-template-rows", "100px");
  document.body.appendChild(root);

  let top = 0;
  root.getBoundingClientRect = () => ({ left: 0, top }) as DOMRect;

  const pageSize = 1500;
  const scroll$ = new Subject<Element>();
  const { buffer$, ready$ } = await pipeline({
    length$: new BehaviorSubject(length),
    pageProvider$: new BehaviorSubject(createPageProvider(allItems)),
    pageProviderDebounceTime$: of(0),
    pageSize$: new BehaviorSubject(pageSize),
    itemRect$: new BehaviorSubject({ width: 100, height: 100 } as DOMRect),
    rootResize$: new BehaviorSubject<Element>(root),
    scroll$,
    respectScrollToOnResize$: of(true),
    scrollTo$: of(undefined),
  });

  let emissions = 0;
  buffer$.subscribe(() => emissions++);
  ready$.subscribe();
  // load the pages the benchmark scrolls through
  for (let line = 0; line <= LINES; line += 10) {
    top = -line * 100;
    scroll$.next(root);
  }
  await new Promise((resolve) => setTimeout(resolve, 50));

  bench(
    `${LINES} scroll events, one line each`,
    () => {
      for (let line = 0; line < LINES; line++) {
        top = -line * 100;
        scroll$.next(root);
      }
    },
    options,
  );

  bench(
    `${LINES} scroll events, 2px each (window rarely moves)`,
    () => {
      for (let step = 0; step < LINES; step++) {
        top = -5000 - step * 2;
        scroll$.next(root);
      }
    },
    options,
  );
});
