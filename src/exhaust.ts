import { isIterator, isAsyncIterator } from "./is-iterator.ts";

export const exhaustSync = <T>(iterator: Iterable<T>): T[] => {
  return [...iterator];
};
export const exhaustAsync = async <T>(
  asyncIterator: AsyncIterable<T>
): Promise<T[]> => {
  const r: T[] = [];
  for await (const o of asyncIterator) {
    r.push(o);
  }
  return r;
};

export function exhaust<T>(obj: Iterable<T>): T[];
export function exhaust<T>(obj: AsyncIterable<T>): Promise<T[]>;
export function exhaust(obj: unknown): unknown[] | Promise<unknown[]>;
export function exhaust(obj: unknown): unknown[] | Promise<unknown[]> {
  if (isIterator(obj)) {
    return exhaustSync(obj);
  } else if (isAsyncIterator(obj)) {
    return exhaustAsync(obj);
  }
  throw new TypeError(`${obj} is not iterable`);
}

export default exhaust;
