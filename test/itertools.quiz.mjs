import quiz, { deepequal } from "pop-quiz";
import {
  takeWhileSync,
  takeWhileAsync,
  dropWhileSync,
  dropWhileAsync,
  compressSync,
  compressAsync,
  windowedSync,
  windowedAsync,
  pairwiseSync,
  pairwiseAsync,
  groupBySync,
  groupByAsync,
  chainSync,
  chainAsync,
  flattenSync,
  flattenAsync,
  cycleSync,
  cycleAsync,
  repeatSync,
  repeatAsync,
  uniqueSync,
  uniqueAsync,
  enumerateSync,
  enumerateAsync,
  starmapSync,
  starmapAsync,
  zipLongestSync,
  zipLongestAsync,
  isliceSync,
  isliceAsync,
} from "../index.mjs";
import eventualequal from "../assertions/eventualequal.mjs";

const asyncFromArray = (items) =>
  (async function* () {
    for (const item of items) yield item;
  })();

await quiz("takeWhileSync/takeWhileAsync", async function* () {
  yield deepequal(
    [...takeWhileSync((x) => x < 3, [1, 2, 3, 4, 1])],
    [1, 2],
    "should stop at the first item failing the predicate"
  );
  yield await eventualequal(
    takeWhileAsync((x) => x < 3, asyncFromArray([1, 2, 3, 4, 1])),
    [1, 2]
  );
});

await quiz("dropWhileSync/dropWhileAsync", async function* () {
  yield deepequal(
    [...dropWhileSync((x) => x < 3, [1, 2, 3, 4, 1])],
    [3, 4, 1],
    "should drop leading items matching the predicate, then yield the rest"
  );
  yield await eventualequal(
    dropWhileAsync((x) => x < 3, asyncFromArray([1, 2, 3, 4, 1])),
    [3, 4, 1]
  );
});

await quiz("compressSync/compressAsync", async function* () {
  yield deepequal(
    [...compressSync(["a", "b", "c", "d"], [1, 0, 1, 0])],
    ["a", "c"],
    "should keep items whose selector is truthy"
  );
  yield await eventualequal(
    compressAsync(asyncFromArray(["a", "b", "c", "d"]), [1, 0, 1, 0]),
    ["a", "c"]
  );
});

await quiz("windowedSync/windowedAsync", async function* () {
  yield deepequal(
    [...windowedSync([1, 2, 3, 4, 5], 3)],
    [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ],
    "should yield overlapping windows of size 3"
  );
  yield await eventualequal(windowedAsync(asyncFromArray([1, 2, 3, 4, 5]), 3), [
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
  ]);
});

await quiz("pairwiseSync/pairwiseAsync", async function* () {
  yield deepequal(
    [...pairwiseSync([1, 2, 3, 4])],
    [
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    "should yield successive overlapping pairs"
  );
  yield await eventualequal(pairwiseAsync(asyncFromArray([1, 2, 3, 4])), [
    [1, 2],
    [2, 3],
    [3, 4],
  ]);
});

// Regression/spec check: groupBy groups only *consecutive* runs, matching
// Python's itertools.groupby -- it must NOT merge non-adjacent occurrences
// of the same key.
await quiz("groupBySync/groupByAsync group consecutive runs only", async function* () {
  yield deepequal(
    [...groupBySync([1, 1, 2, 1])],
    [
      [1, [1, 1]],
      [2, [2]],
      [1, [1]],
    ],
    "non-adjacent 1s must NOT be merged into a single group"
  );
  yield await eventualequal(groupByAsync(asyncFromArray([1, 1, 2, 1])), [
    [1, [1, 1]],
    [2, [2]],
    [1, [1]],
  ]);
});

await quiz("chainSync/chainAsync", async function* () {
  yield deepequal([...chainSync([1, 2], [3, 4])], [1, 2, 3, 4], "should chain iterables in order");
  yield await eventualequal(chainAsync(asyncFromArray([1, 2]), [3, 4]), [1, 2, 3, 4]);
});

await quiz("flattenSync/flattenAsync", async function* () {
  yield deepequal(
    [...flattenSync([[1, 2], [3, 4]])],
    [1, 2, 3, 4],
    "should flatten one level of nested iterables"
  );
  yield await eventualequal(flattenAsync(asyncFromArray([[1, 2], [3, 4]])), [1, 2, 3, 4]);
});

await quiz("cycleSync/cycleAsync", async function* () {
  yield deepequal(
    [...isliceSync(cycleSync([1, 2, 3]), 7)],
    [1, 2, 3, 1, 2, 3, 1],
    "should replay a one-shot source indefinitely"
  );
  const out = [];
  for await (const x of isliceAsync(cycleAsync(asyncFromArray([1, 2, 3])), 7)) out.push(x);
  yield deepequal(out, [1, 2, 3, 1, 2, 3, 1], "cycleAsync should also replay indefinitely");
});

await quiz("repeatSync/repeatAsync", async function* () {
  yield deepequal([...repeatSync("x", 3)], ["x", "x", "x"], "should repeat the value N times");
  yield await eventualequal(repeatAsync("x", 3), ["x", "x", "x"]);
});

await quiz("uniqueSync/uniqueAsync", async function* () {
  yield deepequal(
    [...uniqueSync([1, 1, 2, 3, 2, 1])],
    [1, 2, 3],
    "should yield only the first occurrence of each key, globally"
  );
  yield await eventualequal(uniqueAsync(asyncFromArray([1, 1, 2, 3, 2, 1])), [1, 2, 3]);
});

await quiz("enumerateSync/enumerateAsync", async function* () {
  yield deepequal(
    [...enumerateSync(["a", "b", "c"])],
    [
      [0, "a"],
      [1, "b"],
      [2, "c"],
    ],
    "should pair each item with its index"
  );
  yield deepequal(
    [...enumerateSync(["a", "b"], 5)],
    [
      [5, "a"],
      [6, "b"],
    ],
    "should honor a custom start index"
  );
  yield await eventualequal(enumerateAsync(asyncFromArray(["a", "b", "c"])), [
    [0, "a"],
    [1, "b"],
    [2, "c"],
  ]);
});

await quiz("starmapSync/starmapAsync", async function* () {
  yield deepequal(
    [...starmapSync((a, b) => a + b, [[1, 2], [3, 4]])],
    [3, 7],
    "should spread each item's contents as arguments"
  );
  yield await eventualequal(
    starmapAsync((a, b) => a + b, asyncFromArray([[1, 2], [3, 4]])),
    [3, 7]
  );
});

await quiz("zipLongestSync/zipLongestAsync", async function* () {
  yield deepequal(
    [...zipLongestSync(null, [1, 2, 3], ["a", "b"])],
    [
      [1, "a"],
      [2, "b"],
      [3, null],
    ],
    "should continue to the longest input, filling exhausted ones"
  );
  const out = [];
  for await (const x of zipLongestAsync(null, asyncFromArray([1, 2, 3]), ["a", "b"])) out.push(x);
  yield deepequal(
    out,
    [
      [1, "a"],
      [2, "b"],
      [3, null],
    ],
    "zipLongestAsync should also continue to the longest input"
  );
});

await quiz("isliceSync/isliceAsync overload arities", async function* () {
  yield deepequal([...isliceSync([1, 2, 3, 4, 5], 3)], [1, 2, 3], "islice(it, stop)");
  yield deepequal([...isliceSync([1, 2, 3, 4, 5], 1, 4)], [2, 3, 4], "islice(it, start, stop)");
  yield deepequal(
    [...isliceSync([1, 2, 3, 4, 5, 6, 7, 8], 1, 8, 2)],
    [2, 4, 6, 8],
    "islice(it, start, stop, step)"
  );
  yield await eventualequal(isliceAsync(asyncFromArray([1, 2, 3, 4, 5]), 3), [1, 2, 3]);
});
