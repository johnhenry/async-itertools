import quiz, { deepequal } from "pop-quiz";
import { zipSync, zipAsync } from "../index.mjs";
import eventualequal from "../assertions/eventualequal.mjs";

const asyncFromArray = (items) =>
  (async function* () {
    for (const item of items) yield item;
  })();

// Regression: zipAsync was the missing dual of zipSync -- there was no way
// to zip async iterables at all before this.
await quiz("zipAsync mirrors zipSync (regression: zipAsync did not exist)", async function* () {
  yield deepequal(
    [...zipSync([1, 2, 3], ["a", "b", "c"])],
    [
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ],
    "zipSync baseline behavior"
  );
  yield await eventualequal(zipAsync(asyncFromArray([1, 2, 3]), ["a", "b", "c"]), [
    [1, "a"],
    [2, "b"],
    [3, "c"],
  ]);
});

await quiz("zipAsync stops at the shortest input", async function* () {
  yield await eventualequal(zipAsync(asyncFromArray([1, 2, 3]), ["a", "b"]), [
    [1, "a"],
    [2, "b"],
  ]);
});

await quiz("zipAsync accepts a mix of sync and async iterables", async function* () {
  yield await eventualequal(zipAsync([1, 2], asyncFromArray(["a", "b"])), [
    [1, "a"],
    [2, "b"],
  ]);
});
