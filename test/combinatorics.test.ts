import { test } from "node:test";
import assert from "node:assert/strict";
import {
  product,
  productAsync,
  permutations,
  permutationsAsync,
  combinations,
  combinationsAsync,
  combinationsWithReplacement,
  combinationsWithReplacementAsync,
} from "../src/index.ts";
import { asyncFromArray, eventualEqual } from "./helpers.ts";

test("product/productAsync", async () => {
  assert.deepStrictEqual(
    [...product([1, 2], [3, 4])],
    [
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ],
    "should yield the cartesian product, last iterable varying fastest"
  );
  assert.deepStrictEqual(
    [...product()],
    [[]],
    "product of zero iterables should yield one empty tuple"
  );
  await eventualEqual(productAsync(asyncFromArray([1, 2]), [3, 4]), [
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
  ]);
});

test("permutations/permutationsAsync", async () => {
  assert.deepStrictEqual(
    [...permutations([1, 2, 3])],
    [
      [1, 2, 3],
      [1, 3, 2],
      [2, 1, 3],
      [2, 3, 1],
      [3, 1, 2],
      [3, 2, 1],
    ],
    "should yield all full-length permutations"
  );
  assert.deepStrictEqual(
    [...permutations([1, 2, 3], 2)],
    [
      [1, 2],
      [1, 3],
      [2, 1],
      [2, 3],
      [3, 1],
      [3, 2],
    ],
    "should yield all r-length permutations"
  );
  assert.deepStrictEqual([...permutations([1, 2, 3], 0)], [[]], "r=0 should yield one empty tuple");
  await eventualEqual(permutationsAsync(asyncFromArray([1, 2, 3]), 2), [
    [1, 2],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 2],
  ]);
});

test("combinations/combinationsAsync", async () => {
  assert.deepStrictEqual(
    [...combinations([1, 2, 3], 2)],
    [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    "should yield all r-length combinations without replacement"
  );
  assert.deepStrictEqual([...combinations([1, 2], 5)], [], "r > n should yield nothing");
  assert.deepStrictEqual([...combinations([1, 2, 3], 0)], [[]], "r=0 should yield one empty tuple");
  await eventualEqual(combinationsAsync(asyncFromArray([1, 2, 3]), 2), [
    [1, 2],
    [1, 3],
    [2, 3],
  ]);
});

test("combinationsWithReplacement/combinationsWithReplacementAsync", async () => {
  assert.deepStrictEqual(
    [...combinationsWithReplacement([1, 2], 2)],
    [
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    "should yield all r-length combinations, allowing repeats"
  );
  await eventualEqual(combinationsWithReplacementAsync(asyncFromArray([1, 2]), 2), [
    [1, 1],
    [1, 2],
    [2, 2],
  ]);
});
