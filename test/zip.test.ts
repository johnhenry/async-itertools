import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, zipAsync } from "../src/index.ts";
import { asyncFromArray, eventualEqual } from "./helpers.ts";

// Regression: zipAsync was the missing dual of zipSync -- there was no way
// to zip async iterables at all before this.
test("zipAsync mirrors zipSync (regression: zipAsync did not exist)", async () => {
  assert.deepStrictEqual(
    [...zipSync<number | string>([1, 2, 3], ["a", "b", "c"])],
    [
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ],
    "zipSync baseline behavior"
  );
  await eventualEqual(zipAsync<number | string>(asyncFromArray([1, 2, 3]), ["a", "b", "c"]), [
    [1, "a"],
    [2, "b"],
    [3, "c"],
  ]);
});

test("zipAsync stops at the shortest input", async () => {
  await eventualEqual(zipAsync<number | string>(asyncFromArray([1, 2, 3]), ["a", "b"]), [
    [1, "a"],
    [2, "b"],
  ]);
});

test("zipAsync accepts a mix of sync and async iterables", async () => {
  await eventualEqual(zipAsync<number | string>([1, 2], asyncFromArray(["a", "b"])), [
    [1, "a"],
    [2, "b"],
  ]);
});
