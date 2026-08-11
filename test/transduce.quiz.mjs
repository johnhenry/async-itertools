import quiz, { deepequal, equal } from "pop-quiz";
import { transduceSync, transducers, countSync } from "../index.mjs";

const { map, take, drop, filter, group, accumulate, reject, dedupe, interpose, partitionBy, tap } =
  transducers;

await quiz("transducer:map", function* () {
  const original = [1, 2, 3, 4, 5];
  const plusOne = transduceSync(map((x) => x + 1));
  yield deepequal(
    [...plusOne(original)],
    [2, 3, 4, 5, 6],
    "should map items to 1 plus item"
  );
});

await quiz("transducer:filter", function* () {
  const original = [1, 2, 3, 4, 5];
  const greaterThanThree = transduceSync(filter((x) => x > 3));
  yield deepequal(
    [...greaterThanThree(original)],
    [4, 5],
    "should filter out items greater than 3"
  );
});
await quiz("transducer:take", function* () {
  const original = [1, 2, 3, 4, 5];
  const greaterThanThree = transduceSync(take(3));
  yield deepequal(
    [...greaterThanThree(original)],
    [1, 2, 3],
    "should take first three items"
  );
});
await quiz("transducer:group", function* () {
  const original = [1, 2, 3, 4];
  const pair = transduceSync(group(2));
  yield deepequal(
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
await quiz("transducer:group flushes trailing partial group (regression)", function* () {
  const original = [1, 2, 3, 4, 5, 6, 7];
  const triplet = transduceSync(group(3));
  yield deepequal(
    [...triplet(original)],
    [
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ],
    "trailing partial group [7] must be flushed on completion"
  );
});

await quiz("transducer:accumulate", function* () {
  const original = [1, 2, 3, 4];
  const sum = transduceSync(
    accumulate((a, b) => a + b, 0),
    drop(3)
  );
  yield deepequal(
    [...sum(original)],
    [10],
    "should accumnulate changes in successive items"
  );
});

// Regression: the old numeric `reject(limit)` (skip first N items) was
// renamed to `drop(limit)` to free up `reject` for a predicate-based
// complement to `filter`, matching Python's itertools.filterfalse.
await quiz("transducer:drop drops the first N items (renamed from reject)", function* () {
  const original = [1, 2, 3, 4, 5];
  const dropThree = transduceSync(drop(3));
  yield deepequal([...dropThree(original)], [4, 5], "drop(3) should drop the first 3 items");
});

await quiz("transducer:reject (predicate) complements filter", function* () {
  const original = [1, 2, 3, 4, 5];
  const rejectEven = transduceSync(reject((x) => x % 2 === 0));
  yield deepequal([...rejectEven(original)], [1, 3, 5], "reject(even) should keep only odd items");
});

await quiz("transducer:dedupe skips consecutive duplicates only", function* () {
  const skipDupes = transduceSync(dedupe());
  yield deepequal(
    [...skipDupes([1, 1, 2, 2, 1, 1, 3])],
    [1, 2, 1, 3],
    "consecutive duplicates should collapse, but non-adjacent 1s must both survive"
  );
});

await quiz("transducer:interpose inserts a separator between items", function* () {
  const withCommas = transduceSync(interpose(","));
  yield deepequal(
    [...withCommas([1, 2, 3])],
    [1, ",", 2, ",", 3],
    "separator should appear between items, not before the first or after the last"
  );
  yield deepequal([...withCommas([1])], [1], "a single item should have no separator at all");
  yield deepequal([...withCommas([])], [], "an empty input should yield nothing");
});

await quiz("transducer:partitionBy groups consecutive runs by key", function* () {
  const byIdentity = transduceSync(partitionBy());
  yield deepequal(
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
await quiz("transducer:partitionBy flushes a trailing partial run (regression)", function* () {
  const byIdentity = transduceSync(partitionBy());
  yield deepequal(
    [...byIdentity([1, 1, 2, 2, 2])],
    [
      [1, 1],
      [2, 2, 2],
    ],
    "the trailing [2,2,2] run must be flushed on completion, not dropped"
  );
});

await quiz("transducer:partitionBy composes with a stacked stateful transducer", function* () {
  // Proves .complete() cascades correctly through two stacked stateful
  // transducers (partitionBy's completion must trigger group's too).
  const stacked = transduceSync(partitionBy(), group(1));
  yield deepequal(
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
await quiz("transduce memory stays bounded over 1M items (leak regression)", function* () {
  const gc = globalThis.gc; // available via --expose-gc in the npm test script
  const pipeline = transduceSync(map((x) => x + 1));
  let count = 0;
  let heapAt100k = 0;
  let heapAt1M = 0;
  for (const value of pipeline(countSync(1, 1_000_000))) {
    count++;
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
  yield equal(count, 1_000_000, "all 1M items must flow through the pipeline");
  const growth = heapAt1M - heapAt100k;
  const limit = (gc ? 8 : 64) * 2 ** 20; // a few MB with gc; generous headroom without
  yield equal(
    growth < limit,
    true,
    `heap growth 100k->1M must stay bounded (grew ${(growth / 2 ** 20).toFixed(2)}MB, limit ${
      limit / 2 ** 20
    }MB)`
  );
});

await quiz("transducer:tap calls fn for side effects without altering values", function* () {
  const seen = [];
  const withTap = transduceSync(tap((x) => seen.push(x)));
  yield deepequal([...withTap([1, 2, 3])], [1, 2, 3], "output values must be unchanged");
  yield deepequal(seen, [1, 2, 3], "fn should have been called once per item, in order");
});
