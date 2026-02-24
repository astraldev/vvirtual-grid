import { type MaybeElementRef, unrefElement, tryOnUnmounted } from "@vueuse/core";
import { watch } from "vue";
import { Observable, Subject } from "rxjs";
import { getElementScrollParents } from "../utilites";

export function fromScrollParent(elRef: MaybeElementRef): Observable<Element> {
  const scrollSubject = new Subject<Element>();

  watch(
    () => unrefElement(elRef),
    (element) => {
      if (!element) return;
      const { vertical, horizontal } = getElementScrollParents(element);

      const targets = vertical === horizontal
        ? [vertical]
        : [vertical, horizontal]

      const scrollParents = targets.map((parent) => {
        return parent === document.documentElement ? window : parent;
      })

      const cleanup = new AbortController()
      const handler = () => scrollSubject.next(element);
      scrollParents.forEach((parent) => {
        parent.addEventListener("scroll", handler, {
          signal: cleanup.signal,
          passive: true,
          capture: true,
        })
      })

      tryOnUnmounted(() => cleanup.abort())
    },
  );

  return scrollSubject;
}