import quiz, { deepequal } from "pop-quiz";
import { transduceSync, transducers } from "../index.mjs";

const { map, take, drop, filter, group, accumulate, reject } = transducers;

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
