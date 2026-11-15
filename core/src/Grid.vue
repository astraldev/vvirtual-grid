<template>
  <component :is="tag" v-show="length > 0" ref="root" :style="rootStyles">
    <component v-if="ready" :is="probeTag" :style="csrProbeStyles" ref="probe">
      <slot name="probe" />
    </component>

    <template
      v-for="internalItem in buffer"
      :key="
        getKey ? getKey(internalItem) : keyPrefix + '.' + internalItem.index
      "
    >
      <slot
        v-if="internalItem.value === undefined"
        name="placeholder"
        :index="internalItem.index"
        :style="internalItem.style"
        :total="buffer.length"
      />
      <slot
        v-else
        name="default"
        :item="internalItem.value"
        :index="internalItem.index"
        :style="internalItem.style"
        :total="buffer.length"
      />
    </template>
    <component v-if="!ready" :is="probeTag" :style="ssrProbeStyles" ref="probe">
      <slot name="probe" />
    </component>
  </component>
</template>

<script lang="ts" setup generic="T extends object">
import { type VueInstance, tryOnUnmounted, unrefElement } from "@vueuse/core";
import { once } from "ramda";
import {
  type PropType,
  useTemplateRef,
  onUpdated,
  computed,
  type StyleValue,
  watch,
  shallowRef,
  useId,
} from "vue";
import {
  type PageProvider,
  type InternalItem,
  pipeline,
  type ScrollAction,
} from "./pipeline";
import { fromProp, fromResizeObserver } from "./utilites";
import {
  type GridDimensions,
  type ItemCell,
  type ItemRect,
  getGridDimensions as computeGridDimensions,
  getItemCellByIndex,
  getItemRectByIndex,
} from "./position";
import { fromScrollParent } from "./composables/useFromScrollParent";
import { useObservable } from "./composables/useObservable";
import type { Observable } from "rxjs";

const props = defineProps({
  /** Total number of items in the list  */
  length: {
    type: Number as PropType<number>,
    required: true,
    validator: (value: number) => Number.isInteger(value) && value >= 0,
  },

  /* The callback that returns a page of items as a promise. */
  pageProvider: {
    type: Function as PropType<PageProvider<T>>,
    required: true,
  },

  /**
   * Debounce window in milliseconds on the calls to `pageProvider`,
   * which is useful for avoiding network requests of skimmed pages.
   */
  pageProviderDebounceTime: {
    type: Number as PropType<number>,
    required: false,
    default: 0,
    validator: (value: number) => Number.isInteger(value) && value >= 0,
  },

  /** The number of items in a page from the item provider (e.g. a backend API). */
  pageSize: {
    type: Number as PropType<number>,
    required: true,
    validator: (value: number) => Number.isInteger(value) && value >= 1,
  },

  /** Scroll to a specific item by index, must be less than the length prop */
  scrollTo: {
    type: Number as PropType<number>,
    required: false,
    validator: (value: number) => Number.isInteger(value) && value >= 0,
  },

  /** Snap to `scrollTo` when the grid container is resized */
  respectScrollToOnResize: {
    type: Boolean as PropType<boolean>,
    required: false,
    default: true,
  },

  /** The scroll behavior to use when scrolling to an item. */
  scrollBehavior: {
    type: String as PropType<"smooth" | "auto">,
    required: false,
    default: "smooth",
    validator: (value: string) => ["smooth", "auto"].includes(value),
  },

  /** Rendered tag for the wrapper */
  tag: {
    type: String as PropType<string>,
    required: false,
    default: "div",
  },

  /** The tag to use for the probe element. */
  probeTag: {
    type: String as PropType<string>,
    required: false,
    default: "div",
  },

  /** Method for key extraction from items */
  getKey: {
    type: Function as PropType<(internalItem: InternalItem) => number | string>,
    required: false,
    default: undefined,
  },

  /**
   * Called after an element marked with `data-index` starts rendering an item.
   * Not called at all, and costs nothing, when no element is marked.
   */
  onItemBind: {
    type: Function as PropType<(index: number, element: HTMLElement) => void>,
    required: false,
    default: undefined,
  },

  /** Called after the item of an index stops being rendered by any marked element. */
  onItemUnbind: {
    type: Function as PropType<(index: number) => void>,
    required: false,
    default: undefined,
  },

  /** Called when a scroll parent of the grid scrolls, i.e. the items moved in the viewport. */
  onViewportScroll: {
    type: Function as PropType<() => void>,
    required: false,
    default: undefined,
  },

  /** Called after the grid is measured again (item size, gaps, tracks or flow changed). */
  onLayoutChange: {
    type: Function as PropType<() => void>,
    required: false,
    default: undefined,
  },
});

const rootRef = useTemplateRef<HTMLElement | VueInstance>("root");
const probeRef = useTemplateRef<HTMLElement | VueInstance>("probe");

// a stream of root elements when scrolling
const scroll$ = fromScrollParent(rootRef);

const {
  ready$, // has the buffer has started calculating with the DOM
  buffer$, // the items in the current scanning window
  contentSize$, // the size of the whole list
  scrollAction$, // the value sent to window.scrollTo()
  allItems$, // all items memoized by the grid
  measurement$, // the measurement used to position the items
} = await pipeline({
  // streams of prop
  length$: fromProp(props, "length"),
  pageProvider$: fromProp(props, "pageProvider"),
  pageProviderDebounceTime$: fromProp(props, "pageProviderDebounceTime"),
  pageSize$: fromProp(props, "pageSize"),
  // a stream of item size measurements when it is changed
  itemRect$: fromResizeObserver(probeRef, "contentRect"),
  // a stream of root elements when it is resized
  rootResize$: fromResizeObserver(rootRef, "target"),
  scroll$,
  respectScrollToOnResize$: fromProp(props, "respectScrollToOnResize"),
  scrollTo$: fromProp(props, "scrollTo"),
});

const sharedProbeStyles = computed(() => {
  return {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    zIndex: -1,
    placeSelf: "stretch",
  };
});

const ssrProbeStyles = computed(() => {
  return { ...sharedProbeStyles.value };
});

const csrProbeStyles = computed(() => {
  return {
    ...sharedProbeStyles.value,
    gridArea: "1/1",
  };
});

onUpdated(
  once(() => {
    scrollAction$.subscribe(({ target, top, left }: ScrollAction) => {
      target.scrollTo({ top, left, behavior: props.scrollBehavior });
    });
  }),
);

const buffer = useObservable<InternalItem<T>[]>(
  buffer$ as Observable<InternalItem<T>[]>,
);

const ready = useObservable(ready$);
const contentSize = useObservable(contentSize$);
const rootStyles = computed<StyleValue>(() =>
  Object.fromEntries([
    ...Object.entries(contentSize.value ?? {}).map(([property, value]) => [
      property,
      value + "px",
    ]),
    ["placeContent", "start"],
  ]),
);

const keyPrefix = shallowRef(useId());
watch(
  () => props.pageProvider,
  () => (keyPrefix.value = new Date().getTime().toString()),
);

const allItems = useObservable(allItems$);

// region: low-level primitives
const measurement = useObservable(measurement$);

function isValidIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < props.length;
}

/**
 * Writes the rectangle of an item into `out`, whether it is rendered or not.
 * Returns `false`, leaving `out` untouched, until the grid is measured or
 * when the index is out of range.
 *
 * - `"grid"` (default): relative to the first item. Pure arithmetic.
 * - `"viewport"`: like `getBoundingClientRect()`. Reads the layout once.
 */
function getItemRect(
  index: number,
  out: ItemRect,
  relativeTo: "grid" | "viewport" = "grid",
): boolean {
  const currentMeasurement = measurement.value;
  if (!currentMeasurement || !ready.value || !isValidIndex(index)) return false;

  if (relativeTo === "viewport") {
    // the probe sits in the first cell without being translated
    const probeEl = unrefElement(probeRef);
    if (!probeEl) return false;

    const origin = probeEl.getBoundingClientRect();
    getItemRectByIndex(index, currentMeasurement, out);
    out.x += origin.left;
    out.y += origin.top;
  } else {
    getItemRectByIndex(index, currentMeasurement, out);
  }

  return true;
}

/** Writes the zero-based visual row and column of an item into `out`. */
function getItemCell(index: number, out: ItemCell): boolean {
  const currentMeasurement = measurement.value;
  if (!currentMeasurement || !isValidIndex(index)) return false;

  getItemCellByIndex(index, currentMeasurement, out);
  return true;
}

/** Writes the total number of visual rows and columns into `out`. */
function getGridDimensions(out: GridDimensions): boolean {
  const currentMeasurement = measurement.value;
  if (!currentMeasurement) return false;

  computeGridDimensions(props.length, currentMeasurement, out);
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
 * Only elements marked with `data-index` by the slots can be found.
 */
function getItemElement(index: number): HTMLElement | null {
  const rootEl = unrefElement(rootRef);
  if (!rootEl) return null;

  for (let el = rootEl.firstElementChild; el; el = el.nextElementSibling) {
    if (readIndex(el) === index) return el as HTMLElement;
  }

  return null;
}

/** The index of the item rendered by, or around, an element. -1 if none. */
function getItemIndex(target: EventTarget | null): number {
  const rootEl = unrefElement(rootRef);
  if (!rootEl || !(target instanceof Element)) return -1;

  let node: Element | null = target;
  while (node && node.parentElement !== rootEl) node = node.parentElement;

  return node ? readIndex(node) : -1;
}
// endregion

// region: low-level hooks, they do nothing unless a callback is given
const scrollSubscription = scroll$.subscribe(() => {
  if (props.onViewportScroll) props.onViewportScroll();
});
tryOnUnmounted(() => scrollSubscription.unsubscribe());

watch(
  measurement,
  () => {
    if (props.onLayoutChange) props.onLayoutChange();
  },
  { flush: "post" },
);

// two maps swapped on every pass, so tracking the bound elements never allocates
let boundElements = new Map<number, Element>();
let nextBoundElements = new Map<number, Element>();

function reportUnbound(_element: Element, index: number) {
  if (!nextBoundElements.has(index) && props.onItemUnbind) {
    props.onItemUnbind(index);
  }
}

watch(
  buffer,
  () => {
    if (!props.onItemBind && !props.onItemUnbind) return;

    const rootEl = unrefElement(rootRef);
    if (!rootEl) return;

    nextBoundElements.clear();
    for (let el = rootEl.firstElementChild; el; el = el.nextElementSibling) {
      const index = readIndex(el);
      if (index === -1) continue;

      nextBoundElements.set(index, el);
      // also reported when another element takes over the same index,
      // e.g. when a placeholder is replaced by the loaded item
      if (boundElements.get(index) !== el && props.onItemBind) {
        props.onItemBind(index, el as HTMLElement);
      }
    }
    boundElements.forEach(reportUnbound);

    const previous = boundElements;
    boundElements = nextBoundElements;
    nextBoundElements = previous;
    nextBoundElements.clear(); // do not keep removed elements alive
  },
  { flush: "post" },
);
// endregion

defineExpose({
  allItems,
  ready,
  measurement,
  getItemRect,
  getItemCell,
  getGridDimensions,
  getItemElement,
  getItemIndex,
});
</script>
