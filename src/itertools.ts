/**
 * Python itertools-parity building blocks.
 *
 * Unlike the curried transducer factories in transducers.ts (which are
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

import {
  concatSync,
  concatAsync,
  zipSync,
  zipAsync,
} from "./iterator-tools.ts";
import { isAsyncIterator } from "./is-iterator.ts";

/**
 * Yield items while predicate holds; stop (without consuming further) at
 * the first item that fails it. Predicate-based complement to the
 * numeric `take` transducer.
 * @kind function
 * @name takeWhileSync
 */
export function* takeWhileSync<T>(
  predicate: (item: T) => boolean,
  iterable: Iterable<T>
): Generator<T> {
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
export async function* takeWhileAsync<T>(
  predicate: (item: T) => boolean,
  iterable: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<T> {
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
export function* dropWhileSync<T>(
  predicate: (item: T) => boolean,
  iterable: Iterable<T>
): Generator<T> {
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
export async function* dropWhileAsync<T>(
  predicate: (item: T) => boolean,
  iterable: AsyncIterable<T>
): AsyncGenerator<T> {
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
export function* compressSync<T>(
  iterable: Iterable<T>,
  selectors: Iterable<unknown>
): Generator<T> {
  for (const [item, keep] of zipSync<unknown>(iterable, selectors)) {
    if (keep) yield item as T;
  }
}

/**
 * Asynchronous dual of compressSync.
 * @kind function
 * @name compressAsync
 */
export async function* compressAsync<T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  selectors: AsyncIterable<unknown> | Iterable<unknown>
): AsyncGenerator<T> {
  for await (const [item, keep] of zipAsync<unknown>(iterable, selectors)) {
    if (keep) yield item as T;
  }
}

/**
 * Yield overlapping windows of `n` consecutive items.
 * @kind function
 * @name windowedSync
 */
export function* windowedSync<T>(
  iterable: Iterable<T>,
  n: number
): Generator<T[]> {
  const buf: T[] = [];
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
export async function* windowedAsync<T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  n: number
): AsyncGenerator<T[]> {
  const buf: T[] = [];
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
export function* pairwiseSync<T>(iterable: Iterable<T>): Generator<[T, T]> {
  yield* windowedSync(iterable, 2) as Generator<[T, T]>;
}

/**
 * Asynchronous dual of pairwiseSync.
 * @kind function
 * @name pairwiseAsync
 */
export async function* pairwiseAsync<T>(
  iterable: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<[T, T]> {
  yield* windowedAsync(iterable, 2) as AsyncGenerator<[T, T]>;
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
export function* groupBySync<T, K = T>(
  iterable: Iterable<T>,
  keyFn: (item: T) => K = (x) => x as unknown as K
): Generator<[K, T[]]> {
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
export async function* groupByAsync<T, K = T>(
  iterable: AsyncIterable<T>,
  keyFn: (item: T) => K = (x) => x as unknown as K
): AsyncGenerator<[K, T[]]> {
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
export function* flattenSync<T>(
  iterableOfIterables: Iterable<Iterable<T>>
): Generator<T> {
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
export async function* flattenAsync<T>(
  iterableOfIterables:
    | AsyncIterable<AsyncIterable<T> | Iterable<T>>
    | Iterable<AsyncIterable<T> | Iterable<T>>
): AsyncGenerator<T> {
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
export function* cycleSync<T>(iterable: Iterable<T>): Generator<T> {
  const buffer: T[] = [];
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
export async function* cycleAsync<T>(
  iterable: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<T> {
  const buffer: T[] = [];
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
export function* repeatSync<T>(value: T, times = Infinity): Generator<T> {
  for (let i = 0; i < times; i++) {
    yield value;
  }
}

/**
 * Asynchronous dual of repeatSync.
 * @kind function
 * @name repeatAsync
 */
export async function* repeatAsync<T>(
  value: T,
  times = Infinity
): AsyncGenerator<T> {
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
export function* uniqueSync<T, K = T>(
  iterable: Iterable<T>,
  keyFn: (item: T) => K = (x) => x as unknown as K
): Generator<T> {
  const seen = new Set<K>();
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
export async function* uniqueAsync<T, K = T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  keyFn: (item: T) => K = (x) => x as unknown as K
): AsyncGenerator<T> {
  const seen = new Set<K>();
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
export function* enumerateSync<T>(
  iterable: Iterable<T>,
  start = 0
): Generator<[number, T]> {
  yield* Iterator.from(iterable).map(
    (value, index): [number, T] => [index + start, value]
  );
}

/**
 * Asynchronous dual of enumerateSync (hand-rolled -- no native
 * AsyncIterator helpers are shipped yet).
 * @kind function
 * @name enumerateAsync
 */
export async function* enumerateAsync<T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  start = 0
): AsyncGenerator<[number, T]> {
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
export function* starmapSync<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  iterableOfArgArrays: Iterable<Args>
): Generator<R> {
  yield* Iterator.from(iterableOfArgArrays).map((args) => fn(...args));
}

/**
 * Asynchronous dual of starmapSync.
 * @kind function
 * @name starmapAsync
 */
export async function* starmapAsync<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  iterableOfArgArrays: AsyncIterable<Args> | Iterable<Args>
): AsyncGenerator<R> {
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
 * @param fillValue value used once an input is exhausted
 * @param iteratorList iterables to zip
 */
export function* zipLongestSync<T, F>(
  fillValue: F,
  ...iteratorList: Array<Iterable<T>>
): Generator<Array<T | F>> {
  const generators = iteratorList.map((iterator) =>
    iterator[Symbol.iterator]()
  );
  while (true) {
    const result: Array<T | F> = [];
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
export async function* zipLongestAsync<T, F>(
  fillValue: F,
  ...iteratorList: Array<AsyncIterable<T> | Iterable<T>>
): AsyncGenerator<Array<T | F>> {
  const generators = iteratorList.map((iterator) =>
    isAsyncIterator(iterator)
      ? (iterator as AsyncIterable<T>)[Symbol.asyncIterator]()
      : (iterator as Iterable<T>)[Symbol.iterator]()
  );
  while (true) {
    const results = await Promise.all(generators.map((g) => g.next()));
    if (results.every(({ done }) => done)) return;
    yield results.map(({ value, done }) => (done ? fillValue : (value as T)));
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
export function* isliceSync<T>(
  iterable: Iterable<T>,
  ...args: Array<number | null | undefined>
): Generator<T> {
  let start = 0,
    stop: number | null | undefined = Infinity,
    step = 1;
  if (args.length === 1) [stop] = args;
  else if (args.length === 2) [start, stop] = args as [number, number];
  else if (args.length >= 3) [start, stop, step] = args as [number, number, number];
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
export async function* isliceAsync<T>(
  iterable: AsyncIterable<T>,
  ...args: Array<number | null | undefined>
): AsyncGenerator<T> {
  let start = 0,
    stop: number | null | undefined = Infinity,
    step = 1;
  if (args.length === 1) [stop] = args;
  else if (args.length === 2) [start, stop] = args as [number, number];
  else if (args.length >= 3) [start, stop, step] = args as [number, number, number];
  if (stop == null) stop = Infinity;
  if (step < 1) throw new RangeError("islice step must be >= 1");
  const it = iterable[Symbol.asyncIterator]();
  let i = 0;
  for (let r = await it.next(); !r.done && i < stop; r = await it.next(), i++) {
    if (i >= start && (i - start) % step === 0) yield r.value;
  }
}
