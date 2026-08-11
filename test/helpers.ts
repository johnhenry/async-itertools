import assert from "node:assert/strict";

/** A one-shot async iterable over the given items. */
export const asyncFromArray = <T>(items: T[]): AsyncGenerator<T> =>
  (async function* () {
    for (const item of items) yield item;
  })();

/** Collect any (a)sync iterable into an array. */
export const collect = async <T>(
  iterable: AsyncIterable<T> | Iterable<T>
): Promise<T[]> => {
  const out: T[] = [];
  for await (const item of iterable) {
    out.push(item);
  }
  return out;
};

/**
 * node:test replacement for the old pop-quiz `eventualequal` assertion:
 * exhausts `actual` (sync or async) and deep-compares to `expected`.
 */
export const eventualEqual = async <T>(
  actual: AsyncIterable<T> | Iterable<T>,
  expected: T[],
  message?: string
): Promise<void> => {
  assert.deepStrictEqual(await collect(actual), expected, message);
};
