import { tryOnUnmounted } from "@vueuse/core";
import { take, type Observable } from "rxjs";
import { type Ref, shallowRef } from "vue";

export function useObservable<H>(observable: Observable<H>): Readonly<Ref<H>> {
  const valueRef = shallowRef<H>();
  const subscription = observable.subscribe((val) => (valueRef.value = val));

  tryOnUnmounted(() => subscription.unsubscribe());

  return valueRef as Readonly<Ref<H>>;
}
