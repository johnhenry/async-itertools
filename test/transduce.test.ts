import { test } from "node:test";
import assert from "node:assert/strict";
import { transduceSync, transducers, countSync } from "../src/index.ts";

const {
  map,
  take,
  drop,
  filter,
  group,
  accumulate,
  reject,
  dedupe,
  interpose,
  partitionBy,
  tap,
} = transducers;

test("transducer:map", () => {
  const original = [1, 2, 3, 4, 5];
  const plusOne = transduceSync(map((x: number) => x + 1));
  assert.deepStrictEqual(
    [...plusOne(original)],
    [2, 3, 4, 5, 6],
    "should map items to 1 plus item"
  );
});

test("transducer:filter", () => {
  const original = [1, 2, 3, 4, 5];
  const greaterThanThree = transduceSync(filter((x: number) => x > 3));
  assert.deepStrictEqual(
    [...greaterThanThree(original)],
    [4, 5],
    "should filter out items greater than 3"
  );
});

test("transducer:take", () => {
  const original = [1, 2, 3, 4, 5];
  const firstThree = transduceSync(take<number>(3));
  assert.deepStrictEqual(
    [...firstThree(original)],
    [1, 2, 3],
    "should take first three items"
  );
});

test("transducer:group", () => {
  const original = [1, 2, 3, 4];
  const pair = transduceSync(group<number>(2));
  assert.deepStrictEqual(
    [...pair(original)],
    [
      [1, 2],
      [3, 4],
    ],
    "should group items into pairs"
  );
});

// Regression: group() previously had no completion/flush step, so a
// trailing partial group (here, [7]) was silently dropped instead of
// being emitted once the source iterator was exhausted.
test("transducer:group flushes trailing partial group (regression)", () => {
  const original = [1, 2, 3, 4, 5, 6, 7];
  const triplet = transduceSync(group<number>(3));
  assert.deepStrictEqual(
    [...triplet(original)],
    [
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ],
    "trailing partial group [7] must be flushed on completion"
  );
});

test("transducer:accumulate", () => {
  const original = [1, 2, 3, 4];
  const sum = transduceSync(
    accumulate((a: number, b: number) => a + b, 0),
    drop<number>(3)
  );
  assert.deepStrictEqual(
    [...sum(original)],
    [10],
    "should accumulate changes in successive items"
  );
});

// Regression: the old numeric `reject(limit)` (skip first N items) was
// renamed to `drop(limit)` to free up `reject` for a predicate-based
// complement to `filter`, matching Python's itertools.filterfalse.
test("transducer:drop drops the first N items (renamed from reject)", () => {
  const original = [1, 2, 3, 4, 5];
  const dropThree = transduceSync(drop<number>(3));
  assert.deepStrictEqual(
    [...dropThree(original)],
    [4, 5],
    "drop(3) should drop the first 3 items"
  );
});

test("transducer:reject (predicate) complements filter", () => {
  const original = [1, 2, 3, 4, 5];
  const rejectEven = transduceSync(reject((x: number) => x % 2 === 0));
  assert.deepStrictEqual(
    [...rejectEven(original)],
    [1, 3, 5],
    "reject(even) should keep only odd items"
  );
});

test("transducer:dedupe skips consecutive duplicates only", () => {
  const skipDupes = transduceSync(dedupe<number>());
  assert.deepStrictEqual(
    [...skipDupes([1, 1, 2, 2, 1, 1, 3])],
    [1, 2, 1, 3],
    "consecutive duplicates should collapse, but non-adjacent 1s must both survive"
  );
});

test("transducer:interpose inserts a separator between items", () => {
  const withCommas = transduceSync(interpose<number, string>(","));
  assert.deepStrictEqual(
    [...withCommas([1, 2, 3])],
    [1, ",", 2, ",", 3],
    "separator should appear between items, not before the first or after the last"
  );
  assert.deepStrictEqual(
    [...withCommas([1])],
    [1],
    "a single item should have no separator at all"
  );
  assert.deepStrictEqual(
    [...withCommas([])],
    [],
    "an empty input should yield nothing"
  );
});

test("transducer:partitionBy groups consecutive runs by key", () => {
  const byIdentity = transduceSync(partitionBy<number>());
  assert.deepStrictEqual(
    [...byIdentity([1, 1, 2, 1, 1])],
    [
      [1, 1],
      [2],
      [1, 1],
    ],
    "should group consecutive runs, and NOT merge the non-adjacent [1,1] runs together"
  );
});

// Regression-style proof: the .complete() protocol must work for any
// stateful transducer, not just the original `group` -- this is the
// second stateful transducer to rely on it, and its trailing run must
// also be flushed once the source iterator completes.
test("transducer:partitionBy flushes a trailing partial run (regression)", () => {
  const byIdentity = transduceSync(partitionBy<number>());
  assert.deepStrictEqual(
    [...byIdentity([1, 1, 2, 2, 2])],
    [
      [1, 1],
      [2, 2, 2],
    ],
    "the trailing [2,2,2] run must be flushed on completion, not dropped"
  );
});

test("transducer:partitionBy composes with a stacked stateful transducer", () => {
  // Proves .complete() cascades correctly through two stacked stateful
  // transducers (partitionBy's completion must trigger group's too).
  const stacked = transduceSync(partitionBy<number>(), group<number[]>(1));
  assert.deepStrictEqual(
    [...stacked([1, 1, 2, 1, 1])],
    [[[1, 1]], [[2]], [[1, 1]]],
    "completion must cascade through both stateful stages"
  );
});

// Regression: through v2.0.0 the transduce engine threaded its accumulator
// as an iterable that every step wrapped in a fresh generator
// (`conjoin(init, item)`), chaining one retained generator object per item
// processed (~176 bytes/item measured) -- unbounded heap growth on long
// streams, OOM-ing a 48MB heap after a few million items. The v2.1
// pending-emission-buffer protocol must keep memory flat: heap growth
// between the 100k-th and 1,000,000-th item must stay under a few MB
// (the old code grew ~158MB over the same span).
test("transduce memory stays bounded over 1M items (leak regression)", () => {
  const gc = globalThis.gc; // available via --expose-gc in the npm test script
  const pipeline = transduceSync(map((x: number) => x + 1));
  let count = 0;
  let heapAt100k = 0;
  let heapAt1M = 0;
  for (const value of pipeline(countSync(1, 1_000_000))) {
    count += value - value + 1;
    if (count === 100_000) {
      gc && gc();
      heapAt100k = process.memoryUsage().heapUsed;
    } else if (count === 1_000_000) {
      // Measured *inside* the loop, while the pipeline generator is still
      // live -- the old chain was only reachable until the loop ended, so
      // sampling after the loop would mask the leak entirely.
      gc && gc();
      heapAt1M = process.memoryUsage().heapUsed;
    }
  }
  assert.strictEqual(count, 1_000_000, "all 1M items must flow through the pipeline");
  const growth = heapAt1M - heapAt100k;
  const limit = (gc ? 8 : 64) * 2 ** 20; // a few MB with gc; generous headroom without
  assert.ok(
    growth < limit,
    `heap growth 100k->1M must stay bounded (grew ${(growth / 2 ** 20).toFixed(
      2
    )}MB, limit ${limit / 2 ** 20}MB)`
  );
});

test("transducer:tap calls fn for side effects without altering values", () => {
  const seen: number[] = [];
  const withTap = transduceSync(tap((x: number) => seen.push(x)));
  assert.deepStrictEqual(
    [...withTap([1, 2, 3])],
    [1, 2, 3],
    "output values must be unchanged"
  );
  assert.deepStrictEqual(
    seen,
    [1, 2, 3],
    "fn should have been called once per item, in order"
  );
});
