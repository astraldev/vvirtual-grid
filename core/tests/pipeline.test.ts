import { describe, it, expect } from "vitest";
import { pipeline } from "../src/pipeline";
import { of, firstValueFrom } from "rxjs";
import type { PageProvider } from "../src/pipeline";

describe("pipeline integration", () => {
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
  };

  const mockRoot = document.createElement("div");

  it("emits SSR items immediately upon initialization", async () => {
    const pageSize = 20;
    const length = 1000;

    // Mock page provider that returns identifiable items
    const pageProvider: PageProvider = async (pageNumber, size) => {
      return Array.from({ length: size }, (_, i) => ({
        id: `item-${pageNumber}-${i}`,
        index: pageNumber * size + i,
      }));
    };

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

    // Initialize pipeline
    const { buffer$ } = await pipeline(input);

    // The first value emitted by buffer$ should be the startWith(ssrBuffer)
    const firstBuffer = await firstValueFrom(buffer$);

    expect(firstBuffer.length).toBe(pageSize);
    expect(firstBuffer[0].index).toBe(0);
    expect(firstBuffer[0].value).toBeDefined();
    expect(firstBuffer[0].style).toBeUndefined(); // SSR items shouldn't have style yet
  });
});
