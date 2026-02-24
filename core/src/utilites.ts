import {
  animationFrameScheduler,
  EMPTY,
  fromEventPattern,
  map,
  mergeAll,
  Observable,
  scheduled,
} from "rxjs";
import { watchEffect } from "vue";
import { partial, pipe, unary } from "ramda";
import { type MaybeElementRef, useResizeObserver } from "@vueuse/core";

export function fromProp<T, U extends keyof T>(
  props: T,
  propName: U,
): Observable<T[U]> {
  return new Observable((subscriber) =>
    watchEffect(() => subscriber.next(props[propName])),
  );
}

export function fromResizeObserver<T extends keyof ResizeObserverEntry>(
  elRef: MaybeElementRef,
  pluckTarget: T,
): Observable<ResizeObserverEntry[T]> {
  if (typeof window === "undefined") return EMPTY;

  return scheduled(
    fromEventPattern<ResizeObserverEntry[]>(
      pipe(unary, partial(useResizeObserver, [elRef])),
    ),
    animationFrameScheduler,
  ).pipe(
    mergeAll(),
    map<ResizeObserverEntry, ResizeObserverEntry[T]>(
      (entry) => entry[pluckTarget],
    ),
  );
}

interface ScrollParents {
  vertical: Element;
  horizontal: Element;
}

export function getElementScrollParents(
  element: Element,
  includeHidden: boolean = false,
): ScrollParents {
  const style = getComputedStyle(element);

  if (style.position === "fixed") {
    return {
      vertical: document.body,
      horizontal: document.body,
    };
  }

  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden
    ? /(auto|scroll|hidden)/
    : /(auto|scroll)/;

  let vertical;
  let horizontal;

  for (
    let parent: Element | null = element;
    // parent.assignedSlot.parentElement find the correct parent if the grid is inside a native web component
    (parent = parent.assignedSlot?.parentElement ?? parent.parentElement);
  ) {
    const parentStyle = getComputedStyle(parent);

    if (excludeStaticParent && parentStyle.position === "static") continue;

    if (!horizontal && overflowRegex.test(parentStyle.overflowX)) {
      horizontal = parent;
      if (vertical) return { vertical, horizontal };
    }

    if (!vertical && overflowRegex.test(parentStyle.overflowY)) {
      vertical = parent;
      if (horizontal) return { vertical, horizontal };
    }
  }

  const fallback = document.scrollingElement || document.documentElement;
  return {
    vertical: vertical ?? fallback,
    horizontal: horizontal ?? fallback,
  };
}
