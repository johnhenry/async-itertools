/**
 * Combinatorial generators: product, permutations, combinations,
 * combinationsWithReplacement -- ports of the iterative equivalent-code
 * algorithms documented in CPython's itertools docs (chosen over a
 * recursive approach to avoid recursion-depth limits on large inputs).
 *
 * These are inherently "materialize fully, then compute" algorithms in
 * Python too (CPython's own docs note product() completely consumes its
 * inputs before running). Every function here has an Async variant that
 * accepts async iterable sources: the materialization step (via
 * exhaustAsync, already provided by exhaust.ts) is cleanly separable
 * from the combinatorial generation step, so `xAsync` just awaits full
 * materialization and then runs the same sync generator internally,
 * yielding through an async generator. This is a "collect-then-compute"
 * shape, not a streaming one -- see docs/discussion/python-itertools.md.
 */

import { exhaustAsync } from "./exhaust.ts";

function* productFromPools<T>(pools: T[][]): Generator<T[]> {
  if (pools.some((pool) => pool.length === 0)) return;
  const indices = pools.map(() => 0);
  while (true) {
    yield pools.map((pool, i) => pool[indices[i]]);
    let i = indices.length - 1;
    while (i >= 0) {
      indices[i]++;
      if (indices[i] < pools[i].length) break;
      indices[i] = 0;
      i--;
    }
    if (i < 0) return;
  }
}

/**
 * Cartesian product of the given iterables. Mirrors Python's
 * itertools.product(*iterables) -- the last iterable varies fastest.
 * @kind function
 * @name product
 */
export function* product<T>(...iterables: Array<Iterable<T>>): Generator<T[]> {
  yield* productFromPools(iterables.map((it) => [...it]));
}

/**
 * Asynchronous dual of product; accepts async iterable sources.
 * @kind function
 * @name productAsync
 */
export async function* productAsync<T>(
  ...asyncIterables: Array<AsyncIterable<T> | Iterable<T>>
): AsyncGenerator<T[]> {
  const pools = await Promise.all(
    asyncIterables.map(async (it) =>
      Symbol.asyncIterator in Object(it)
        ? exhaustAsync(it as AsyncIterable<T>)
        : [...(it as Iterable<T>)]
    )
  );
  yield* productFromPools(pools);
}

function* permutationsFromPool<T>(
  pool: T[],
  r?: number | null
): Generator<T[]> {
  const n = pool.length;
  if (r === undefined || r === null) r = n;
  if (r > n || r < 0) return;
  const indices = Array.from({ length: n }, (_, i) => i);
  const cycles = Array.from({ length: r }, (_, i) => n - i);
  yield indices.slice(0, r).map((i) => pool[i]);
  if (n === 0) return;
  outer: while (true) {
    for (let i = r - 1; i >= 0; i--) {
      cycles[i] -= 1;
      if (cycles[i] === 0) {
        const tail = indices.slice(i + 1).concat(indices.slice(i, i + 1));
        indices.splice(i, indices.length - i, ...tail);
        cycles[i] = n - i;
      } else {
        const j = cycles[i];
        const a = indices[i];
        const b = indices[n - j];
        indices[i] = b;
        indices[n - j] = a;
        yield indices.slice(0, r).map((idx) => pool[idx]);
        continue outer;
      }
    }
    return;
  }
}

/**
 * r-length permutations of `iterable` (default r = pool length). Mirrors
 * Python's itertools.permutations(iterable, r).
 * @kind function
 * @name permutations
 */
export function* permutations<T>(
  iterable: Iterable<T>,
  r?: number
): Generator<T[]> {
  yield* permutationsFromPool([...iterable], r);
}

/**
 * Asynchronous dual of permutations; accepts an async iterable source.
 * @kind function
 * @name permutationsAsync
 */
export async function* permutationsAsync<T>(
  asyncIterable: AsyncIterable<T>,
  r?: number
): AsyncGenerator<T[]> {
  const pool = await exhaustAsync(asyncIterable);
  yield* permutationsFromPool(pool, r);
}

function* combinationsFromPool<T>(pool: T[], r: number): Generator<T[]> {
  const n = pool.length;
  if (r > n || r < 0) return;
  const indices = Array.from({ length: r }, (_, i) => i);
  yield indices.map((i) => pool[i]);
  while (true) {
    let i = -1;
    for (let k = r - 1; k >= 0; k--) {
      if (indices[k] !== k + n - r) {
        i = k;
        break;
      }
    }
    if (i === -1) return;
    indices[i] += 1;
    for (let j = i + 1; j < r; j++) {
      indices[j] = indices[j - 1] + 1;
    }
    yield indices.map((idx) => pool[idx]);
  }
}

/**
 * r-length combinations of `iterable`, in sorted (input) order, without
 * replacement. Mirrors Python's itertools.combinations(iterable, r).
 * @kind function
 * @name combinations
 */
export function* combinations<T>(
  iterable: Iterable<T>,
  r: number
): Generator<T[]> {
  yield* combinationsFromPool([...iterable], r);
}

/**
 * Asynchronous dual of combinations; accepts an async iterable source.
 * @kind function
 * @name combinationsAsync
 */
export async function* combinationsAsync<T>(
  asyncIterable: AsyncIterable<T>,
  r: number
): AsyncGenerator<T[]> {
  const pool = await exhaustAsync(asyncIterable);
  yield* combinationsFromPool(pool, r);
}

function* combinationsWithReplacementFromPool<T>(
  pool: T[],
  r: number
): Generator<T[]> {
  const n = pool.length;
  if (n === 0 && r > 0) return;
  const indices: number[] = new Array(r).fill(0);
  yield indices.map((i) => pool[i]);
  while (true) {
    let i = -1;
    for (let k = r - 1; k >= 0; k--) {
      if (indices[k] !== n - 1) {
        i = k;
        break;
      }
    }
    if (i === -1) return;
    const value = indices[i] + 1;
    for (let j = i; j < r; j++) {
      indices[j] = value;
    }
    yield indices.map((idx) => pool[idx]);
  }
}

/**
 * r-length combinations of `iterable`, with replacement. Mirrors Python's
 * itertools.combinations_with_replacement(iterable, r).
 * @kind function
 * @name combinationsWithReplacement
 */
export function* combinationsWithReplacement<T>(
  iterable: Iterable<T>,
  r: number
): Generator<T[]> {
  yield* combinationsWithReplacementFromPool([...iterable], r);
}

/**
 * Asynchronous dual of combinationsWithReplacement; accepts an async
 * iterable source.
 * @kind function
 * @name combinationsWithReplacementAsync
 */
export async function* combinationsWithReplacementAsync<T>(
  asyncIterable: AsyncIterable<T>,
  r: number
): AsyncGenerator<T[]> {
  const pool = await exhaustAsync(asyncIterable);
  yield* combinationsWithReplacementFromPool(pool, r);
}
