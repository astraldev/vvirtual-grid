import { toValue, type MaybeRefOrGetter } from "vue";

export function createPageProvider<T>(data: MaybeRefOrGetter<T[]>) {
  return (page: number, pageSize: number) => {
    const content = toValue(data);

    const totalLength = content.length;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, totalLength);

    if (start >= totalLength) return [];

    return content.slice(start, end);
  };
}
