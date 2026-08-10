import quiz, { deepequal } from "pop-quiz";
import { transduceSync, transducers } from "../index.mjs";

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

await quiz("transducer:tap calls fn for side effects without altering values", function* () {
  const seen = [];
  const withTap = transduceSync(tap((x) => seen.push(x)));
  yield deepequal([...withTap([1, 2, 3])], [1, 2, 3], "output values must be unchanged");
  yield deepequal(seen, [1, 2, 3], "fn should have been called once per item, in order");
});
