import { bench, describe } from "vitest";
import { pipeline } from "../src/pipeline";
import { of, firstValueFrom, filter } from "rxjs";
import { createPageProvider } from "../src";

describe("pipeline performance", () => {
  const mockItemRect = {
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRectReadOnly;

  const mockRoot = document.createElement("div");
  // Mock dimensions to simulate a window that sees some items
  Object.defineProperty(window, "innerWidth", { value: 1024 });
  Object.defineProperty(window, "innerHeight", { value: 768 });

  const length = 1_000_000;
  const pageSize = 1500;

  const pageProvider = createPageProvider(Array.from({ length }));

  const input = {
    length$: of(length),
    pageProvider$: of(pageProvider),
    pageProviderDebounceTime$: of(0),
    pageSize$: of(pageSize),
    itemRect$: of(mockItemRect),
    rootResize$: of(mockRoot),
    scroll$: of(mockRoot),
    respectScrollToOnResize$: of(true),
    scrollTo$: of(undefined),
  };

  bench("initialization and first emission (100k items)", async () => {
    const { ready$ } = await pipeline(input);
    await firstValueFrom(ready$.pipe(filter((v) => v === true)));
  });

  bench("first emission & recompute (100k items)", async () => {
    const { ready$, recompute } = await pipeline(input);
    await firstValueFrom(ready$.pipe(filter((v) => v === true)));
    await recompute();
  });
});
