import { tryOnUnmounted } from "@vueuse/core";
import { type Observable } from "rxjs";
import { type Ref, shallowRef } from "vue";

/**
 * Mirrors an observable into a ref. Pass `target` to write into a ref that was
 * created earlier, e.g. one exposed before an `await` in an async setup.
 */
export function useObservable<H>(
  observable: Observable<H>,
  target: Ref<H | undefined> = shallowRef<H>(),
): Readonly<Ref<H>> {
  const valueRef = target;
  const subscription = observable.subscribe((val) => (valueRef.value = val));

  tryOnUnmounted(() => subscription.unsubscribe());

  return valueRef as Readonly<Ref<H>>;
}
