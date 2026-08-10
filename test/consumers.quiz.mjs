import quiz, { deepequal, equal } from "pop-quiz";
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
} from "../index.mjs";

const asyncFromArray = (items) =>
  (async function* () {
    for (const item of items) yield item;
  })();

await quiz("someSync/someAsync", async function* () {
  yield equal(someSync((x) => x > 2, [1, 2, 3]), true, "should be true when a match exists");
  yield equal(someSync((x) => x > 5, [1, 2, 3]), false, "should be false when no match exists");
  yield equal(await someAsync((x) => x > 2, asyncFromArray([1, 2, 3])), true, "async: match exists");
  yield equal(await someAsync((x) => x > 5, asyncFromArray([1, 2, 3])), false, "async: no match");

  // Short-circuit proof: an infinite source must not be fully consumed.
  let pulledSync = 0;
  function* infiniteSync() {
    while (true) {
      pulledSync++;
      yield pulledSync;
    }
  }
  someSync((x) => x === 3, infiniteSync());
  yield equal(pulledSync, 3, "someSync must short-circuit at the first match, not exhaust the source");

  let pulledAsync = 0;
  async function* infiniteAsync() {
    while (true) {
      pulledAsync++;
      yield pulledAsync;
    }
  }
  await someAsync((x) => x === 3, infiniteAsync());
  yield equal(pulledAsync, 3, "someAsync must short-circuit at the first match, not exhaust the source");
});

await quiz("everySync/everyAsync", async function* () {
  yield equal(everySync((x) => x > 0, [1, 2, 3]), true, "should be true when all match");
  yield equal(everySync((x) => x > 1, [1, 2, 3]), false, "should be false when one fails");
  yield equal(await everyAsync((x) => x > 0, asyncFromArray([1, 2, 3])), true, "async: all match");
  yield equal(await everyAsync((x) => x > 1, asyncFromArray([1, 2, 3])), false, "async: one fails");
});

await quiz("findSync/findAsync", async function* () {
  yield equal(findSync((x) => x > 1, [1, 2, 3]), 2, "should return the first match");
  yield equal(findSync((x) => x > 5, [1, 2, 3]), undefined, "should return undefined when no match");
  yield equal(await findAsync((x) => x > 1, asyncFromArray([1, 2, 3])), 2, "async: first match");
  yield equal(
    await findAsync((x) => x > 5, asyncFromArray([1, 2, 3])),
    undefined,
    "async: undefined when no match"
  );
});

await quiz("forEachSync/forEachAsync", async function* () {
  const seenSync = [];
  forEachSync((x) => seenSync.push(x), [1, 2, 3]);
  yield deepequal(seenSync, [1, 2, 3], "should call fn once per item, in order");

  const seenAsync = [];
  await forEachAsync((x) => seenAsync.push(x), asyncFromArray([1, 2, 3]));
  yield deepequal(seenAsync, [1, 2, 3], "async: should call fn once per item, in order");
});

await quiz("foldSync/foldAsync", async function* () {
  yield equal(foldSync((a, b) => a + b, 0, [1, 2, 3, 4]), 10, "should sum with a numeric accumulator");
  yield deepequal(
    [...foldSync((set, x) => set.add(x), new Set(), [1, 2, 2, 3])],
    [1, 2, 3],
    "should work with a non-numeric (Set) accumulator"
  );
  yield equal(
    await foldAsync((a, b) => a + b, 0, asyncFromArray([1, 2, 3, 4])),
    10,
    "async: should sum with a numeric accumulator"
  );
});

await quiz("firstSync/firstAsync", async function* () {
  yield equal(firstSync([1, 2, 3]), 1, "should return the first item");
  yield equal(firstSync([], "none"), "none", "should return defaultValue when empty");
  yield equal(firstSync([]), undefined, "should return undefined when empty and no default given");
  yield equal(await firstAsync(asyncFromArray([1, 2, 3])), 1, "async: first item");
  yield equal(await firstAsync(asyncFromArray([]), "none"), "none", "async: defaultValue when empty");
});

await quiz("lastSync/lastAsync", async function* () {
  yield equal(lastSync([1, 2, 3]), 3, "should return the last item");
  yield equal(lastSync([], "none"), "none", "should return defaultValue when empty");
  yield equal(await lastAsync(asyncFromArray([1, 2, 3])), 3, "async: last item");
  yield equal(await lastAsync(asyncFromArray([]), "none"), "none", "async: defaultValue when empty");
});

await quiz("nthSync/nthAsync", async function* () {
  yield equal(nthSync([10, 20, 30, 40], 2), 30, "should return the item at position n");
  yield equal(nthSync([10, 20], 5, "oob"), "oob", "should return defaultValue when out of range");
  yield equal(await nthAsync(asyncFromArray([10, 20, 30, 40]), 2), 30, "async: item at position n");
  yield equal(
    await nthAsync(asyncFromArray([10, 20]), 5, "oob"),
    "oob",
    "async: defaultValue when out of range"
  );
});

await quiz("quantifySync/quantifyAsync", async function* () {
  yield equal(quantifySync([1, 2, 3]), 3, "default predicate should count every item");
  yield equal(quantifySync([1, 2, 3, 4], (x) => x % 2 === 0), 2, "should count only matching items");
  yield equal(await quantifyAsync(asyncFromArray([1, 2, 3])), 3, "async: default counts every item");
  yield equal(
    await quantifyAsync(asyncFromArray([1, 2, 3, 4]), (x) => x % 2 === 0),
    2,
    "async: counts only matching items"
  );
});

await quiz("minSync/maxSync/minAsync/maxAsync", async function* () {
  yield equal(minSync([3, 1, 2]), 1, "should return the minimum item");
  yield equal(maxSync([3, 1, 2]), 3, "should return the maximum item");
  yield equal(minSync(["abc", "a", "ab"], (s) => s.length), "a", "should support a keyFn for min");
  yield equal(maxSync(["abc", "a", "ab"], (s) => s.length), "abc", "should support a keyFn for max");
  yield equal(minSync([], undefined, "empty"), "empty", "should return defaultValue when empty");
  yield equal(maxSync([], undefined, "empty"), "empty", "should return defaultValue when empty");
  yield equal(await minAsync(asyncFromArray([3, 1, 2])), 1, "async: minimum item");
  yield equal(await maxAsync(asyncFromArray([3, 1, 2])), 3, "async: maximum item");
});
