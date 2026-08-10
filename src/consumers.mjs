/**
 * Terminal consumer operations: resolve an iterable to a single value (or a
 * Promise of one), rather than returning another iterable. Two families:
 *
 * - Iterator-Helper parity (some/every/find/forEach/fold): native ES2025
 *   Iterator Helpers give sync code `.some()`/`.every()`/`.find()`/
 *   `.forEach()`/`.reduce()` for free via Iterator.from(iterable); there is
 *   no shipped async equivalent (AsyncIterator helpers are TC39 Stage 2),
 *   so the async half here is hand-rolled.
 * - Summary/aggregate consumers (first/last/nth/quantify/min/max): not part
 *   of core Python itertools, but a near-universal expectation for any
 *   itertools-adjacent library (see itertools-ts's "summary" namespace);
 *   `quantify` specifically is a named recipe from Python's own itertools
 *   docs, not an invented name.
 *
 * House conventions:
 * - Async variants `await` their callback's return value (predicate/fn/keyFn
 *   may be async); sync variants do not, matching native Iterator Helpers'
 *   own non-awaiting behavior and every other sync callback in this library
 *   (groupBySync's keyFn, uniqueSync's keyFn, etc.).
 * - Required-callback functions put the callback first (matching
 *   itertools.mjs: takeWhileSync(predicate, iterable)). Optional-callback
 *   functions put `iterable` first (matching Python's own builtin order:
 *   min(iterable, key=..., default=...)).
 * - find/first/last/nth/min/max return `undefined` (or a caller-supplied
 *   `defaultValue`) on an empty iterable/no match, rather than throwing --
 *   consistent with Array.prototype.find, deliberately diverging from
 *   Python's own min()/max() (which throw without a default).
 *
 * `fold` is named deliberately -- NOT `reduce` -- to avoid colliding with
 * reduceSync/reduceAsync in iterator-tools.mjs, which are an internal
 * streaming primitive (yield* each intermediate result) rather than a
 * terminal reduce-to-one-value.
 */

import { isliceSync, isliceAsync } from "./itertools.mjs";

/**
 * True if any item satisfies predicate. Short-circuits on the first match.
 * @kind function
 * @name someSync
 */
export const someSync = (predicate, iterable) => Iterator.from(iterable).some(predicate);

/**
 * Asynchronous dual of someSync. Short-circuits (a `return` inside
 * `for await...of` closes the underlying async iterator).
 * @kind function
 * @name someAsync
 */
export const someAsync = async (predicate, iterable) => {
  for await (const item of iterable) {
    if (await predicate(item)) return true;
  }
  return false;
};

/**
 * True only if every item satisfies predicate. Short-circuits on the first
 * failure.
 * @kind function
 * @name everySync
 */
export const everySync = (predicate, iterable) => Iterator.from(iterable).every(predicate);

/**
 * Asynchronous dual of everySync.
 * @kind function
 * @name everyAsync
 */
export const everyAsync = async (predicate, iterable) => {
  for await (const item of iterable) {
    if (!(await predicate(item))) return false;
  }
  return true;
};

/**
 * The first item satisfying predicate, or undefined. Short-circuits.
 * @kind function
 * @name findSync
 */
export const findSync = (predicate, iterable) => Iterator.from(iterable).find(predicate);

/**
 * Asynchronous dual of findSync.
 * @kind function
 * @name findAsync
 */
export const findAsync = async (predicate, iterable) => {
  for await (const item of iterable) {
    if (await predicate(item)) return item;
  }
  return undefined;
};

/**
 * Call fn once per item, for side effects. Returns undefined.
 * @kind function
 * @name forEachSync
 */
export const forEachSync = (fn, iterable) => Iterator.from(iterable).forEach(fn);

/**
 * Asynchronous dual of forEachSync. Distinct from `run` (iterator-tools.mjs)
 * -- `run` is framed around "rendering a program" (reversed argument order,
 * `render` defaults to console.log); this is the itertools-parity-family
 * addition with the family's usual (fn, iterable) argument order.
 * @kind function
 * @name forEachAsync
 * @see run
 */
export const forEachAsync = async (fn, iterable) => {
  for await (const item of iterable) {
    await fn(item);
  }
};

/**
 * Reduce iterable to a single value, given an explicit initial value
 * (unlike Array.prototype.reduce, `init` is required -- avoids replicating
 * reduce's "throws on empty array with no initial value" edge case).
 * Named `fold`, not `reduce`, to avoid colliding with reduceSync/reduceAsync
 * (iterator-tools.mjs), which are an internal streaming primitive, not a
 * terminal reduce-to-one-value.
 * @kind function
 * @name foldSync
 */
export const foldSync = (fn, init, iterable) => Iterator.from(iterable).reduce(fn, init);

/**
 * Asynchronous dual of foldSync.
 * @kind function
 * @name foldAsync
 */
export const foldAsync = async (fn, init, iterable) => {
  let acc = init;
  for await (const item of iterable) {
    acc = await fn(acc, item);
  }
  return acc;
};

/**
 * The first item, or defaultValue if the iterable is empty.
 * @kind function
 * @name firstSync
 */
export const firstSync = (iterable, defaultValue) => {
  const { value, done } = iterable[Symbol.iterator]().next();
  return done ? defaultValue : value;
};

/**
 * Asynchronous dual of firstSync.
 * @kind function
 * @name firstAsync
 */
export const firstAsync = async (iterable, defaultValue) => {
  const { value, done } = await iterable[Symbol.asyncIterator]().next();
  return done ? defaultValue : value;
};

/**
 * The last item, or defaultValue if the iterable is empty. Necessarily
 * consumes the entire iterable -- no way around it for a generic source.
 * @kind function
 * @name lastSync
 */
export const lastSync = (iterable, defaultValue) => {
  let result = defaultValue;
  for (const item of iterable) {
    result = item;
  }
  return result;
};

/**
 * Asynchronous dual of lastSync.
 * @kind function
 * @name lastAsync
 */
export const lastAsync = async (iterable, defaultValue) => {
  let result = defaultValue;
  for await (const item of iterable) {
    result = item;
  }
  return result;
};

/**
 * The item at position n (0-indexed), or defaultValue if out of range.
 * Reuses isliceSync rather than duplicating positional-skip logic.
 * @kind function
 * @name nthSync
 */
export const nthSync = (iterable, n, defaultValue) => {
  for (const item of isliceSync(iterable, n, n + 1)) {
    return item;
  }
  return defaultValue;
};

/**
 * Asynchronous dual of nthSync.
 * @kind function
 * @name nthAsync
 */
export const nthAsync = async (iterable, n, defaultValue) => {
  for await (const item of isliceAsync(iterable, n, n + 1)) {
    return item;
  }
  return defaultValue;
};

/**
 * Count items satisfying predicate (default: count all items). Named after
 * the `quantify(iterable, pred=bool)` recipe documented in Python's own
 * itertools docs -- not part of core itertools, but not an invented name
 * either. Deliberately not named `count`/`countSync`, which already mirror
 * Python's itertools.count (an integer *sequence generator*, unrelated).
 * @kind function
 * @name quantifySync
 */
export const quantifySync = (iterable, predicate = () => true) => {
  let count = 0;
  for (const item of iterable) {
    if (predicate(item)) count++;
  }
  return count;
};

/**
 * Asynchronous dual of quantifySync.
 * @kind function
 * @name quantifyAsync
 */
export const quantifyAsync = async (iterable, predicate = () => true) => {
  let count = 0;
  for await (const item of iterable) {
    if (await predicate(item)) count++;
  }
  return count;
};

/**
 * The item with the minimum key (default: the item itself), or defaultValue
 * if the iterable is empty. Necessarily consumes the entire iterable.
 * Mirrors Python's builtin min(iterable, key=..., default=...), but
 * returns undefined rather than throwing when empty and no default is given.
 * @kind function
 * @name minSync
 */
export const minSync = (iterable, keyFn = (x) => x, defaultValue) => {
  let best, bestKey;
  let found = false;
  for (const item of iterable) {
    const key = keyFn(item);
    if (!found || key < bestKey) {
      best = item;
      bestKey = key;
      found = true;
    }
  }
  return found ? best : defaultValue;
};

/**
 * Asynchronous dual of minSync; keyFn may be async.
 * @kind function
 * @name minAsync
 */
export const minAsync = async (iterable, keyFn = (x) => x, defaultValue) => {
  let best, bestKey;
  let found = false;
  for await (const item of iterable) {
    const key = await keyFn(item);
    if (!found || key < bestKey) {
      best = item;
      bestKey = key;
      found = true;
    }
  }
  return found ? best : defaultValue;
};

/**
 * The item with the maximum key (default: the item itself), or defaultValue
 * if the iterable is empty. Mirrors Python's builtin
 * max(iterable, key=..., default=...); see minSync for the
 * undefined-vs-throw divergence.
 * @kind function
 * @name maxSync
 */
export const maxSync = (iterable, keyFn = (x) => x, defaultValue) => {
  let best, bestKey;
  let found = false;
  for (const item of iterable) {
    const key = keyFn(item);
    if (!found || key > bestKey) {
      best = item;
      bestKey = key;
      found = true;
    }
  }
  return found ? best : defaultValue;
};

/**
 * Asynchronous dual of maxSync; keyFn may be async.
 * @kind function
 * @name maxAsync
 */
export const maxAsync = async (iterable, keyFn = (x) => x, defaultValue) => {
  let best, bestKey;
  let found = false;
  for await (const item of iterable) {
    const key = await keyFn(item);
    if (!found || key > bestKey) {
      best = item;
      bestKey = key;
      found = true;
    }
  }
  return found ? best : defaultValue;
};
