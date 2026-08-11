import { test } from "node:test";
import assert from "node:assert/strict";
import {
  someSync,
  someAsync,
  everySync,
  everyAsync,
  findSync,
  findAsync,
  forEachSync,
  forEachAsync,
  foldSync,
  foldAsync,
  firstSync,
  firstAsync,
  lastSync,
  lastAsync,
  nthSync,
  nthAsync,
  quantifySync,
  quantifyAsync,
  minSync,
  minAsync,
  maxSync,
  maxAsync,
} from "../src/index.ts";
import { asyncFromArray } from "./helpers.ts";

test("someSync/someAsync", async () => {
  assert.strictEqual(someSync((x: number) => x > 2, [1, 2, 3]), true, "should be true when a match exists");
  assert.strictEqual(someSync((x: number) => x > 5, [1, 2, 3]), false, "should be false when no match exists");
  assert.strictEqual(await someAsync((x: number) => x > 2, asyncFromArray([1, 2, 3])), true, "async: match exists");
  assert.strictEqual(await someAsync((x: number) => x > 5, asyncFromArray([1, 2, 3])), false, "async: no match");

  // Short-circuit proof: an infinite source must not be fully consumed.
  let pulledSync = 0;
  function* infiniteSync() {
    while (true) {
      pulledSync++;
      yield pulledSync;
    }
  }
  someSync((x) => x === 3, infiniteSync());
  assert.strictEqual(pulledSync, 3, "someSync must short-circuit at the first match, not exhaust the source");

  let pulledAsync = 0;
  async function* infiniteAsync() {
    while (true) {
      pulledAsync++;
      yield pulledAsync;
    }
  }
  await someAsync((x) => x === 3, infiniteAsync());
  assert.strictEqual(pulledAsync, 3, "someAsync must short-circuit at the first match, not exhaust the source");
});

test("everySync/everyAsync", async () => {
  assert.strictEqual(everySync((x: number) => x > 0, [1, 2, 3]), true, "should be true when all match");
  assert.strictEqual(everySync((x: number) => x > 1, [1, 2, 3]), false, "should be false when one fails");
  assert.strictEqual(await everyAsync((x: number) => x > 0, asyncFromArray([1, 2, 3])), true, "async: all match");
  assert.strictEqual(await everyAsync((x: number) => x > 1, asyncFromArray([1, 2, 3])), false, "async: one fails");
});

test("findSync/findAsync", async () => {
  assert.strictEqual(findSync((x: number) => x > 1, [1, 2, 3]), 2, "should return the first match");
  assert.strictEqual(findSync((x: number) => x > 5, [1, 2, 3]), undefined, "should return undefined when no match");
  assert.strictEqual(await findAsync((x: number) => x > 1, asyncFromArray([1, 2, 3])), 2, "async: first match");
  assert.strictEqual(
    await findAsync((x: number) => x > 5, asyncFromArray([1, 2, 3])),
    undefined,
    "async: undefined when no match"
  );
});

test("forEachSync/forEachAsync", async () => {
  const seenSync: number[] = [];
  forEachSync((x: number) => seenSync.push(x), [1, 2, 3]);
  assert.deepStrictEqual(seenSync, [1, 2, 3], "should call fn once per item, in order");

  const seenAsync: number[] = [];
  await forEachAsync((x: number) => seenAsync.push(x), asyncFromArray([1, 2, 3]));
  assert.deepStrictEqual(seenAsync, [1, 2, 3], "async: should call fn once per item, in order");
});

test("foldSync/foldAsync", async () => {
  assert.strictEqual(
    foldSync((a: number, b: number) => a + b, 0, [1, 2, 3, 4]),
    10,
    "should sum with a numeric accumulator"
  );
  assert.strictEqual(
    await foldAsync((a: number, b: number) => a + b, 0, asyncFromArray([1, 2, 3, 4])),
    10,
    "async: should sum with a numeric accumulator"
  );
});

test("firstSync/firstAsync", async () => {
  assert.strictEqual(firstSync([1, 2, 3]), 1, "should return the first item");
  assert.strictEqual(firstSync([], "none"), "none", "should return defaultValue when empty");
  assert.strictEqual(firstSync([]), undefined, "should return undefined when empty and no default given");
  assert.strictEqual(await firstAsync(asyncFromArray([1, 2, 3])), 1, "async: first item");
  assert.strictEqual(await firstAsync(asyncFromArray([]), "none"), "none", "async: defaultValue when empty");
});

test("lastSync/lastAsync", async () => {
  assert.strictEqual(lastSync([1, 2, 3]), 3, "should return the last item");
  assert.strictEqual(lastSync([], "none"), "none", "should return defaultValue when empty");
  assert.strictEqual(await lastAsync(asyncFromArray([1, 2, 3])), 3, "async: last item");
  assert.strictEqual(await lastAsync(asyncFromArray([]), "none"), "none", "async: defaultValue when empty");
});

test("nthSync/nthAsync", async () => {
  assert.strictEqual(nthSync([10, 20, 30, 40], 2), 30, "should return the item at position n");
  assert.strictEqual(nthSync([10, 20], 5, "oob"), "oob", "should return defaultValue when out of range");
  assert.strictEqual(await nthAsync(asyncFromArray([10, 20, 30, 40]), 2), 30, "async: item at position n");
  assert.strictEqual(
    await nthAsync(asyncFromArray([10, 20]), 5, "oob"),
    "oob",
    "async: defaultValue when out of range"
  );
});

test("quantifySync/quantifyAsync", async () => {
  assert.strictEqual(quantifySync([1, 2, 3]), 3, "default predicate should count every item");
  assert.strictEqual(quantifySync([1, 2, 3, 4], (x) => x % 2 === 0), 2, "should count only matching items");
  assert.strictEqual(await quantifyAsync(asyncFromArray([1, 2, 3])), 3, "async: default counts every item");
  assert.strictEqual(
    await quantifyAsync(asyncFromArray([1, 2, 3, 4]), (x) => x % 2 === 0),
    2,
    "async: counts only matching items"
  );
});

test("minSync/maxSync/minAsync/maxAsync", async () => {
  assert.strictEqual(minSync([3, 1, 2]), 1, "should return the minimum item");
  assert.strictEqual(maxSync([3, 1, 2]), 3, "should return the maximum item");
  assert.strictEqual(minSync(["abc", "a", "ab"], (s) => s.length), "a", "should support a keyFn for min");
  assert.strictEqual(maxSync(["abc", "a", "ab"], (s) => s.length), "abc", "should support a keyFn for max");
  assert.strictEqual(minSync([], undefined, "empty"), "empty", "should return defaultValue when empty");
  assert.strictEqual(maxSync([], undefined, "empty"), "empty", "should return defaultValue when empty");
  assert.strictEqual(await minAsync(asyncFromArray([3, 1, 2])), 1, "async: minimum item");
  assert.strictEqual(await maxAsync(asyncFromArray([3, 1, 2])), 3, "async: maximum item");
});
