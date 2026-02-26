import { describe, it, expect } from "vitest";
import { pipeline } from "../src/pipeline";
import { of, firstValueFrom } from "rxjs";
import type { PageProvider } from "../src/pipeline";
import { ref, computed, reactive, nextTick } from "vue";
import { createPageProvider } from "../src";
import { fromProp } from "../src/utilites";

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

  it("ensure that data is recomputed after dependency changes", async () => {
    const data = ref([0, 1, 2, 3]);

    const length = computed(() => data.value.length);
    const pageProvider = createPageProvider(data);

    const props = reactive({
      data,
      length,
      pageProvider,
      pageSize: 3,
    });

    const { buffer$ } = await pipeline({
      length$: fromProp(props, "length"),
      pageProvider$: fromProp(props, "pageProvider"),
      pageProviderDebounceTime$: of(0),
      pageSize$: fromProp(props, "pageSize"),
      itemRect$: of(mockItemRect),
      rootResize$: of(mockRoot),
      scroll$: of(mockRoot),
      respectScrollToOnResize$: of(true),
      scrollTo$: of(undefined),
    });

    const firstBuffer = await firstValueFrom(buffer$);
    expect(firstBuffer[0].value as any).toBe(0);

    let latestBuffer: any[] = [];
    const sub = buffer$.subscribe((b) => {
      latestBuffer = b;
    });

    // Change the reactive list
    data.value = [4, 5, 6];

    // 1 tick for the prop to update
    await nextTick();

    // 1 tick for the data to be computed
    await nextTick();

    expect(latestBuffer.length).toBeGreaterThan(0);
    expect(latestBuffer[0].value as any).toBe(4);
    sub.unsubscribe();
  });
});
