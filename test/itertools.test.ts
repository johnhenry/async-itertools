import { test } from "node:test";
import assert from "node:assert/strict";
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
} from "../src/index.ts";
import { asyncFromArray, eventualEqual, collect } from "./helpers.ts";

test("takeWhileSync/takeWhileAsync", async () => {
  assert.deepStrictEqual(
    [...takeWhileSync((x: number) => x < 3, [1, 2, 3, 4, 1])],
    [1, 2],
    "should stop at the first item failing the predicate"
  );
  await eventualEqual(
    takeWhileAsync((x: number) => x < 3, asyncFromArray([1, 2, 3, 4, 1])),
    [1, 2]
  );
});

test("dropWhileSync/dropWhileAsync", async () => {
  assert.deepStrictEqual(
    [...dropWhileSync((x: number) => x < 3, [1, 2, 3, 4, 1])],
    [3, 4, 1],
    "should drop leading items matching the predicate, then yield the rest"
  );
  await eventualEqual(
    dropWhileAsync((x: number) => x < 3, asyncFromArray([1, 2, 3, 4, 1])),
    [3, 4, 1]
  );
});

test("compressSync/compressAsync", async () => {
  assert.deepStrictEqual(
    [...compressSync(["a", "b", "c", "d"], [1, 0, 1, 0])],
    ["a", "c"],
    "should keep items whose selector is truthy"
  );
  await eventualEqual(
    compressAsync(asyncFromArray(["a", "b", "c", "d"]), [1, 0, 1, 0]),
    ["a", "c"]
  );
});

test("windowedSync/windowedAsync", async () => {
  assert.deepStrictEqual(
    [...windowedSync([1, 2, 3, 4, 5], 3)],
    [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ],
    "should yield overlapping windows of size 3"
  );
  await eventualEqual(windowedAsync(asyncFromArray([1, 2, 3, 4, 5]), 3), [
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
  ]);
});

test("pairwiseSync/pairwiseAsync", async () => {
  assert.deepStrictEqual(
    [...pairwiseSync([1, 2, 3, 4])],
    [
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    "should yield successive overlapping pairs"
  );
  await eventualEqual(pairwiseAsync(asyncFromArray([1, 2, 3, 4])), [
    [1, 2],
    [2, 3],
    [3, 4],
  ]);
});

// Regression/spec check: groupBy groups only *consecutive* runs, matching
// Python's itertools.groupby -- it must NOT merge non-adjacent occurrences
// of the same key.
test("groupBySync/groupByAsync group consecutive runs only", async () => {
  assert.deepStrictEqual(
    [...groupBySync([1, 1, 2, 1])],
    [
      [1, [1, 1]],
      [2, [2]],
      [1, [1]],
    ],
    "non-adjacent 1s must NOT be merged into a single group"
  );
  await eventualEqual(groupByAsync(asyncFromArray([1, 1, 2, 1])), [
    [1, [1, 1]],
    [2, [2]],
    [1, [1]],
  ]);
});

test("chainSync/chainAsync", async () => {
  assert.deepStrictEqual(
    [...chainSync([1, 2], [3, 4])],
    [1, 2, 3, 4],
    "should chain iterables in order"
  );
  await eventualEqual(chainAsync(asyncFromArray([1, 2]), [3, 4]), [1, 2, 3, 4]);
});

test("flattenSync/flattenAsync", async () => {
  assert.deepStrictEqual(
    [
      ...flattenSync([
        [1, 2],
        [3, 4],
      ]),
    ],
    [1, 2, 3, 4],
    "should flatten one level of nested iterables"
  );
  await eventualEqual(
    flattenAsync(
      asyncFromArray([
        [1, 2],
        [3, 4],
      ])
    ),
    [1, 2, 3, 4]
  );
});

test("cycleSync/cycleAsync", async () => {
  assert.deepStrictEqual(
    [...isliceSync(cycleSync([1, 2, 3]), 7)],
    [1, 2, 3, 1, 2, 3, 1],
    "should replay a one-shot source indefinitely"
  );
  const out = await collect(isliceAsync(cycleAsync(asyncFromArray([1, 2, 3])), 7));
  assert.deepStrictEqual(
    out,
    [1, 2, 3, 1, 2, 3, 1],
    "cycleAsync should also replay indefinitely"
  );
});

test("repeatSync/repeatAsync", async () => {
  assert.deepStrictEqual(
    [...repeatSync("x", 3)],
    ["x", "x", "x"],
    "should repeat the value N times"
  );
  await eventualEqual(repeatAsync("x", 3), ["x", "x", "x"]);
});

test("uniqueSync/uniqueAsync", async () => {
  assert.deepStrictEqual(
    [...uniqueSync([1, 1, 2, 3, 2, 1])],
    [1, 2, 3],
    "should yield only the first occurrence of each key, globally"
  );
  await eventualEqual(uniqueAsync(asyncFromArray([1, 1, 2, 3, 2, 1])), [1, 2, 3]);
});

test("enumerateSync/enumerateAsync", async () => {
  assert.deepStrictEqual(
    [...enumerateSync(["a", "b", "c"])],
    [
      [0, "a"],
      [1, "b"],
      [2, "c"],
    ],
    "should pair each item with its index"
  );
  assert.deepStrictEqual(
    [...enumerateSync(["a", "b"], 5)],
    [
      [5, "a"],
      [6, "b"],
    ],
    "should honor a custom start index"
  );
  await eventualEqual(enumerateAsync(asyncFromArray(["a", "b", "c"])), [
    [0, "a"],
    [1, "b"],
    [2, "c"],
  ]);
});

test("starmapSync/starmapAsync", async () => {
  assert.deepStrictEqual(
    [
      ...starmapSync((a: number, b: number) => a + b, [
        [1, 2],
        [3, 4],
      ] as Array<[number, number]>),
    ],
    [3, 7],
    "should spread each item's contents as arguments"
  );
  await eventualEqual(
    starmapAsync(
      (a: number, b: number) => a + b,
      asyncFromArray([
        [1, 2],
        [3, 4],
      ] as Array<[number, number]>)
    ),
    [3, 7]
  );
});

test("zipLongestSync/zipLongestAsync", async () => {
  assert.deepStrictEqual(
    [...zipLongestSync<number | string, null>(null, [1, 2, 3], ["a", "b"])],
    [
      [1, "a"],
      [2, "b"],
      [3, null],
    ],
    "should continue to the longest input, filling exhausted ones"
  );
  const out = await collect(
    zipLongestAsync<number | string, null>(null, asyncFromArray([1, 2, 3]), ["a", "b"])
  );
  assert.deepStrictEqual(
    out,
    [
      [1, "a"],
      [2, "b"],
      [3, null],
    ],
    "zipLongestAsync should also continue to the longest input"
  );
});

test("isliceSync/isliceAsync overload arities", async () => {
  assert.deepStrictEqual([...isliceSync([1, 2, 3, 4, 5], 3)], [1, 2, 3], "islice(it, stop)");
  assert.deepStrictEqual(
    [...isliceSync([1, 2, 3, 4, 5], 1, 4)],
    [2, 3, 4],
    "islice(it, start, stop)"
  );
  assert.deepStrictEqual(
    [...isliceSync([1, 2, 3, 4, 5, 6, 7, 8], 1, 8, 2)],
    [2, 4, 6, 8],
    "islice(it, start, stop, step)"
  );
  await eventualEqual(isliceAsync(asyncFromArray([1, 2, 3, 4, 5]), 3), [1, 2, 3]);
});
