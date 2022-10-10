import quiz, { deepequal } from "pop-quiz";
import { transduceSync, transducers } from "../index.mjs";

const { map, take, filter, group, accumulate, reject } = transducers;

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
await quiz("transducer:accumulate", function* () {
  const original = [1, 2, 3, 4];
  const sum = transduceSync(
    accumulate((a, b) => a + b, 0),
    reject(3)
  );
  yield deepequal(
    [...sum(original)],
    [10],
    "should accumnulate changes in successive items"
  );
});
