/**
 * Python itertools-parity building blocks.
 *
 * Unlike the curried transducer factories in transducers.mjs (which are
 * shaped `(...) => (conjoin) => (init, item) => ...` for composition inside
 * transduceSync/transduceAsync), the functions here are flat, direct
 * iterable-in/iterable-out generators -- matching Python's itertools
 * argument order (predicate/fn first, iterable(s) last) so porting a
 * Python recipe is close to mechanical.
 *
 * Where a sync function's behavior is fully covered by native ES2025
 * Iterator Helpers (Iterator.prototype.map/filter/...), it's implemented
 * as a thin wrapper around Iterator.from(iterable) rather than a hand-rolled
 * generator, to keep the maintenance surface small. Async counterparts are
 * always hand-rolled async generators, since AsyncIterator helpers are not
 * yet shipped (TC39 Stage 2).
 *
 * See docs/discussion/python-itertools.md for the full comparison to
 * Python's itertools module and the documented design divergences.
 */

import { concatSync, concatAsync, zipSync, zipAsync } from "./iterator-tools.mjs";
import { isAsyncIterator } from "./is-iterator.mjs";

/**
 * Yield items while predicate holds; stop (without consuming further) at
 * the first item that fails it. Predicate-based complement to the
 * numeric `take` transducer.
 * @kind function
 * @name takeWhileSync
 */
export function* takeWhileSync(predicate, iterable) {
  for (const item of iterable) {
    if (!predicate(item)) return;
    yield item;
  }
}

/**
 * Asynchronous dual of takeWhileSync.
 * @kind function
 * @name takeWhileAsync
 */
export async function* takeWhileAsync(predicate, iterable) {
  for await (const item of iterable) {
    if (!predicate(item)) return;
    yield item;
  }
}

/**
 * Drop items while predicate holds, then yield everything else.
 * Predicate-based complement to the numeric `drop` transducer.
 * @kind function
 * @name dropWhileSync
 */
export function* dropWhileSync(predicate, iterable) {
  const it = iterable[Symbol.iterator]();
  let r = it.next();
  while (!r.done && predicate(r.value)) {
    r = it.next();
  }
  while (!r.done) {
    yield r.value;
    r = it.next();
  }
}

/**
 * Asynchronous dual of dropWhileSync.
 * @kind function
 * @name dropWhileAsync
 */
export async function* dropWhileAsync(predicate, iterable) {
  const it = iterable[Symbol.asyncIterator]();
  let r = await it.next();
  while (!r.done && predicate(r.value)) {
    r = await it.next();
  }
  while (!r.done) {
    yield r.value;
    r = await it.next();
  }
}

/**
 * Select items from `iterable` for which the parallel `selectors` iterable
 * is truthy. Mirrors Python's itertools.compress(data, selectors).
 * @kind function
 * @name compressSync
 */
export function* compressSync(iterable, selectors) {
  for (const [item, keep] of zipSync(iterable, selectors)) {
    if (keep) yield item;
  }
}

/**
 * Asynchronous dual of compressSync.
 * @kind function
 * @name compressAsync
 */
export async function* compressAsync(iterable, selectors) {
  for await (const [item, keep] of zipAsync(iterable, selectors)) {
    if (keep) yield item;
  }
}

/**
 * Yield overlapping windows of `n` consecutive items.
 * @kind function
 * @name windowedSync
 */
export function* windowedSync(iterable, n) {
  const buf = [];
  for (const item of iterable) {
    buf.push(item);
    if (buf.length > n) buf.shift();
    if (buf.length === n) yield buf.slice();
  }
}

/**
 * Asynchronous dual of windowedSync.
 * @kind function
 * @name windowedAsync
 */
export async function* windowedAsync(iterable, n) {
  const buf = [];
  for await (const item of iterable) {
    buf.push(item);
    if (buf.length > n) buf.shift();
    if (buf.length === n) yield buf.slice();
  }
}

/**
 * Yield successive overlapping pairs. Mirrors Python 3.10+'s
 * itertools.pairwise -- a thin call to windowedSync(iterable, 2) so the
 * ring-buffer logic isn't duplicated.
 * @kind function
 * @name pairwiseSync
 */
export function* pairwiseSync(iterable) {
  yield* windowedSync(iterable, 2);
}

/**
 * Asynchronous dual of pairwiseSync.
 * @kind function
 * @name pairwiseAsync
 */
export async function* pairwiseAsync(iterable) {
  yield* windowedAsync(iterable, 2);
}

/**
 * Group consecutive items sharing a key into `[key, items[]]` pairs.
 * Mirrors Python's itertools.groupby, but deliberately diverges from it:
 * Python's sub-iterators are lazy and invalidated by the next outer
 * `next()` call (a well-known footgun); this eagerly materializes each
 * run as an array instead, which is safer and matches what JS developers
 * expect. As in Python, only *consecutive* runs are grouped -- sort the
 * input first if you want all occurrences of a key merged globally.
 * @kind function
 * @name groupBySync
 */
export function* groupBySync(iterable, keyFn = (x) => x) {
  const it = iterable[Symbol.iterator]();
  let r = it.next();
  if (r.done) return;
  let currentKey = keyFn(r.value);
  let bucket = [r.value];
  for (r = it.next(); !r.done; r = it.next()) {
    const key = keyFn(r.value);
    if (Object.is(key, currentKey)) {
      bucket.push(r.value);
    } else {
      yield [currentKey, bucket];
      currentKey = key;
      bucket = [r.value];
    }
  }
  yield [currentKey, bucket];
}

/**
 * Asynchronous dual of groupBySync.
 * @kind function
 * @name groupByAsync
 */
export async function* groupByAsync(iterable, keyFn = (x) => x) {
  const it = iterable[Symbol.asyncIterator]();
  let r = await it.next();
  if (r.done) return;
  let currentKey = keyFn(r.value);
  let bucket = [r.value];
  for (r = await it.next(); !r.done; r = await it.next()) {
    const key = keyFn(r.value);
    if (Object.is(key, currentKey)) {
      bucket.push(r.value);
    } else {
      yield [currentKey, bucket];
      currentKey = key;
      bucket = [r.value];
    }
  }
  yield [currentKey, bucket];
}

/**
 * Chain multiple iterables into one sequence. Mirrors Python's
 * itertools.chain(*iterables); an itertools-parity alias of concatSync.
 * @kind function
 * @name chainSync
 * @see flattenSync
 */
export const chainSync = concatSync;

/**
 * Asynchronous dual of chainSync; alias of concatAsync.
 * @kind function
 * @name chainAsync
 * @see flattenAsync
 */
export const chainAsync = concatAsync;

/**
 * Flatten one level of an iterable-of-iterables. Mirrors Python's
 * itertools.chain.from_iterable -- the single-arg counterpart to
 * chainSync's variadic form. Not recursive.
 * @kind function
 * @name flattenSync
 * @see chainSync
 */
export function* flattenSync(iterableOfIterables) {
  for (const inner of iterableOfIterables) {
    yield* inner;
  }
}

/**
 * Asynchronous dual of flattenSync.
 * @kind function
 * @name flattenAsync
 * @see chainAsync
 */
export async function* flattenAsync(iterableOfIterables) {
  for await (const inner of iterableOfIterables) {
    yield* inner;
  }
}

/**
 * Cycle through `iterable` forever, buffering it on the first pass so a
 * one-shot source (e.g. a generator) can still be replayed. Yields
 * nothing if the source is empty.
 * @kind function
 * @name cycleSync
 */
export function* cycleSync(iterable) {
  const buffer = [];
  for (const item of iterable) {
    buffer.push(item);
    yield item;
  }
  while (buffer.length > 0) {
    yield* buffer;
  }
}

/**
 * Asynchronous dual of cycleSync.
 * @kind function
 * @name cycleAsync
 */
export async function* cycleAsync(iterable) {
  const buffer = [];
  for await (const item of iterable) {
    buffer.push(item);
    yield item;
  }
  while (buffer.length > 0) {
    yield* buffer;
  }
}

/**
 * Yield `value` repeatedly, `times` times (default infinite).
 * @kind function
 * @name repeatSync
 */
export function* repeatSync(value, times = Infinity) {
  for (let i = 0; i < times; i++) {
    yield value;
  }
}

/**
 * Asynchronous dual of repeatSync.
 * @kind function
 * @name repeatAsync
 */
export async function* repeatAsync(value, times = Infinity) {
  for (let i = 0; i < times; i++) {
    yield value;
  }
}

/**
 * Yield only the first occurrence of each key -- global, unbounded-memory
 * dedupe. Mirrors the `unique_everseen` recipe from Python's itertools docs.
 * @kind function
 * @name uniqueSync
 */
export function* uniqueSync(iterable, keyFn = (x) => x) {
  const seen = new Set();
  for (const item of iterable) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      yield item;
    }
  }
}

/**
 * Asynchronous dual of uniqueSync.
 * @kind function
 * @name uniqueAsync
 */
export async function* uniqueAsync(iterable, keyFn = (x) => x) {
  const seen = new Set();
  for await (const item of iterable) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      yield item;
    }
  }
}

/**
 * Yield `[index, value]` pairs, mirroring Python's builtin enumerate().
 * Implemented via native Iterator Helpers: Iterator.prototype.map's
 * callback receives `(value, index)`, unlike Array.prototype.map's
 * `(value, index, array)` -- confirmed present in ES2025.
 * @kind function
 * @name enumerateSync
 */
export function* enumerateSync(iterable, start = 0) {
  yield* Iterator.from(iterable).map((value, index) => [index + start, value]);
}

/**
 * Asynchronous dual of enumerateSync (hand-rolled -- no native
 * AsyncIterator helpers are shipped yet).
 * @kind function
 * @name enumerateAsync
 */
export async function* enumerateAsync(iterable, start = 0) {
  let index = start;
  for await (const value of iterable) {
    yield [index++, value];
  }
}

/**
 * Call `fn` with each item's contents spread as arguments. Mirrors
 * Python's itertools.starmap.
 * @kind function
 * @name starmapSync
 */
export function* starmapSync(fn, iterableOfArgArrays) {
  yield* Iterator.from(iterableOfArgArrays).map((args) => fn(...args));
}

/**
 * Asynchronous dual of starmapSync.
 * @kind function
 * @name starmapAsync
 */
export async function* starmapAsync(fn, iterableOfArgArrays) {
  for await (const args of iterableOfArgArrays) {
    yield fn(...args);
  }
}

/**
 * Zip iterators, continuing to the longest one and filling exhausted
 * ones with `fillValue`. Complement to the strict, stop-at-shortest
 * zipSync/zipAsync. Mirrors Python's itertools.zip_longest.
 * @kind function
 * @name zipLongestSync
 * @param {*} fillValue value used once an input is exhausted
 * @param {...iterable} iteratorList iterables to zip
 */
export function* zipLongestSync(fillValue, ...iteratorList) {
  const generators = iteratorList.map((iterator) => iterator[Symbol.iterator]());
  while (true) {
    const result = [];
    let anyNotDone = false;
    for (const generator of generators) {
      const { value, done } = generator.next();
      if (done) {
        result.push(fillValue);
      } else {
        anyNotDone = true;
        result.push(value);
      }
    }
    if (!anyNotDone) return;
    yield result;
  }
}

/**
 * Asynchronous dual of zipLongestSync. Pulls the next value from every
 * input in parallel each round, like zipAsync.
 * @kind function
 * @name zipLongestAsync
 */
export async function* zipLongestAsync(fillValue, ...iteratorList) {
  const generators = iteratorList.map((iterator) =>
    isAsyncIterator(iterator) ? iterator[Symbol.asyncIterator]() : iterator[Symbol.iterator]()
  );
  while (true) {
    const results = await Promise.all(generators.map((g) => g.next()));
    if (results.every(({ done }) => done)) return;
    yield results.map(({ value, done }) => (done ? fillValue : value));
  }
}

/**
 * General slicing over an iterable. Mirrors Python's itertools.islice
 * overloads: `isliceSync(iterable, stop)` or
 * `isliceSync(iterable, start, stop, step)`. `step` has no native
 * fast-path, so both sync and async are hand-rolled uniformly rather
 * than branching between a native-composed common case and a fallback.
 * @kind function
 * @name isliceSync
 */
export function* isliceSync(iterable, ...args) {
  let start = 0,
    stop = Infinity,
    step = 1;
  if (args.length === 1) [stop] = args;
  else if (args.length === 2) [start, stop] = args;
  else if (args.length >= 3) [start, stop, step] = args;
  if (stop == null) stop = Infinity;
  if (step < 1) throw new RangeError("islice step must be >= 1");
  const it = iterable[Symbol.iterator]();
  let i = 0;
  for (let r = it.next(); !r.done && i < stop; r = it.next(), i++) {
    if (i >= start && (i - start) % step === 0) yield r.value;
  }
}

/**
 * Asynchronous dual of isliceSync.
 * @kind function
 * @name isliceAsync
 */
export async function* isliceAsync(iterable, ...args) {
  let start = 0,
    stop = Infinity,
    step = 1;
  if (args.length === 1) [stop] = args;
  else if (args.length === 2) [start, stop] = args;
  else if (args.length >= 3) [start, stop, step] = args;
  if (stop == null) stop = Infinity;
  if (step < 1) throw new RangeError("islice step must be >= 1");
  const it = iterable[Symbol.asyncIterator]();
  let i = 0;
  for (let r = await it.next(); !r.done && i < stop; r = await it.next(), i++) {
    if (i >= start && (i - start) % step === 0) yield r.value;
  }
}
