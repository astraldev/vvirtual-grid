import { describe, expect, it } from "vitest";
import { __, concat, difference, map, pipe, without, zip } from "ramda";
import {
  accumulateBuffer,
  createVisibleItemsGetter,
  getVisibleItems,
  type InternalItem,
} from "../src/pipeline";

// The implementation before it was optimised, kept as the reference.
function referenceAccumulateBuffer(
  buffer: InternalItem[],
  visibleItems: InternalItem[],
): InternalItem[] {
  const bufferByIndex = new Map(buffer.map((item) => [item.index, item]));
  const effectiveVisible = visibleItems.map((item) => {
    if (item.value === undefined) {
      const buffered = bufferByIndex.get(item.index);
      if (buffered?.value !== undefined) return buffered;
    }
    return item;
  });

  const itemsToAdd = difference(effectiveVisible, buffer);
  const itemsFreeToUse = difference(buffer, effectiveVisible);

  const replaceMap = new Map(zip(itemsFreeToUse, itemsToAdd));
  const itemsToBeReplaced = [...replaceMap.keys()];
  const itemsToReplaceWith = [...replaceMap.values()];

  const itemsToDelete = difference(itemsFreeToUse, itemsToBeReplaced);
  const itemsToAppend = difference(itemsToAdd, itemsToReplaceWith);

  return pipe(
    without(itemsToDelete),
    map((item: InternalItem) => replaceMap.get(item) ?? item),
    concat(__, itemsToAppend),
  )(buffer);
}

const measurement = (columns: number, size: number) => ({
  colGap: 0,
  rowGap: 0,
  flow: "row" as const,
  columns,
  rows: 1,
  itemHeightWithGap: size,
  itemWidthWithGap: size,
});

// deterministic pseudo random numbers
function createRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe("accumulateBuffer", () => {
  it("behaves like the reference implementation while scrolling, loading and resizing", () => {
    const random = createRandom(42);
    const length = 500;
    const allItems: unknown[] = Array(length).fill(undefined);
    let layout = measurement(4, 100);
    let buffer: InternalItem[] = [];
    let reference: InternalItem[] = [];

    for (let step = 0; step < 150; step++) {
      const action = random();
      if (action < 0.25) {
        // a page loads
        const start = Math.floor(random() * length);
        for (let i = start; i < Math.min(start + 30, length); i++) {
          allItems[i] = { id: i };
        }
      } else if (action < 0.3) {
        // loaded items are fetched again as new, equal, objects
        const start = Math.floor(random() * length);
        for (let i = start; i < Math.min(start + 30, length); i++) {
          if (allItems[i] !== undefined) allItems[i] = { id: i };
        }
      } else if (action < 0.35) {
        // a transient emission where a page is not loaded any more
        const start = Math.floor(random() * length);
        for (let i = start; i < Math.min(start + 10, length); i++) {
          allItems[i] = undefined;
        }
      } else if (action < 0.4) {
        layout = measurement(2 + Math.floor(random() * 5), 100);
      }

      const meta = {
        bufferedOffset: Math.floor(random() * length),
        bufferedLength: 8 + Math.floor(random() * 60),
      };
      const visible = getVisibleItems(meta, layout, allItems);

      buffer = accumulateBuffer(buffer, visible);
      reference = referenceAccumulateBuffer(reference, visible);
      expect(buffer).toEqual(reference);
    }
  }, 30_000);

  it("returns the same array when nothing changed", () => {
    const allItems = Array.from({ length: 50 }, (_, id) => ({ id }));
    const meta = { bufferedOffset: 10, bufferedLength: 20 };
    const buffer = accumulateBuffer(
      [],
      getVisibleItems(meta, measurement(4, 100), allItems),
    );

    expect(
      accumulateBuffer(
        buffer,
        getVisibleItems(meta, measurement(4, 100), allItems),
      ),
    ).toBe(buffer);
  });
});

describe("createVisibleItemsGetter", () => {
  it("returns the same items as getVisibleItems", () => {
    const random = createRandom(7);
    const getCached = createVisibleItemsGetter();
    const allItems: unknown[] = Array(300).fill(undefined);
    let layout = measurement(4, 100);

    for (let step = 0; step < 300; step++) {
      if (random() < 0.3) allItems[Math.floor(random() * 300)] = { step };
      if (random() < 0.1) allItems.length = 200 + Math.floor(random() * 100);
      if (random() < 0.1) layout = measurement(2 + (step % 4), 50 + step);

      const meta = {
        bufferedOffset: Math.floor(random() * 320),
        bufferedLength: Math.floor(random() * 40),
      };
      expect(getCached(meta, layout, allItems)).toEqual(
        getVisibleItems(meta, layout, allItems),
      );
    }
  });

  it("hands out the same objects for items that did not change", () => {
    const getCached = createVisibleItemsGetter();
    const allItems: unknown[] = Array.from({ length: 100 }, (_, id) => ({
      id,
    }));
    const layout = measurement(4, 100);

    const first = getCached(
      { bufferedOffset: 0, bufferedLength: 20 },
      layout,
      allItems,
    );
    const second = getCached(
      { bufferedOffset: 4, bufferedLength: 20 },
      { ...layout },
      allItems,
    );
    expect(second[0]).toBe(first[4]);
    expect(second[15]).toBe(first[19]);

    // the very same array when the window and the items are the same
    expect(
      getCached({ bufferedOffset: 4, bufferedLength: 20 }, layout, allItems),
    ).toBe(second);

    allItems[5] = { id: "changed" };
    const third = getCached(
      { bufferedOffset: 4, bufferedLength: 20 },
      layout,
      allItems,
    );
    expect(third).not.toBe(second);
    expect(third[0]).toBe(second[0]);
    expect(third[1]!.value).toEqual({ id: "changed" });
    expect(third[2]).toBe(second[2]);
  });

  it("creates the items again when the layout changes", () => {
    const getCached = createVisibleItemsGetter();
    const allItems = Array.from({ length: 100 }, (_, id) => ({ id }));
    const meta = { bufferedOffset: 0, bufferedLength: 20 };

    const first = getCached(meta, measurement(4, 100), allItems);
    const second = getCached(meta, measurement(5, 100), allItems);
    expect(second[4]).not.toBe(first[4]);
    expect(second[4]!.style!.transform).toBe("translate(400px, 0px)");
  });
});
