export const isIterator = (obj: unknown): obj is Iterable<unknown> =>
  typeof (obj as Iterable<unknown>)?.[Symbol.iterator] === "function";

export const isAsyncIterator = (obj: unknown): obj is AsyncIterable<unknown> =>
  typeof (obj as AsyncIterable<unknown>)?.[Symbol.asyncIterator] === "function";

export const exhaustable = (obj: unknown): boolean =>
  isIterator(obj) || isAsyncIterator(obj);

export default exhaustable;
