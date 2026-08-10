import quiz, { deepequal } from "pop-quiz";
import {
  product,
  productAsync,
  permutations,
  permutationsAsync,
  combinations,
  combinationsAsync,
  combinationsWithReplacement,
  combinationsWithReplacementAsync,
} from "../index.mjs";
import eventualequal from "../assertions/eventualequal.mjs";

const asyncFromArray = (items) =>
  (async function* () {
    for (const item of items) yield item;
  })();

await quiz("product/productAsync", async function* () {
  yield deepequal(
    [...product([1, 2], [3, 4])],
    [
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ],
    "should yield the cartesian product, last iterable varying fastest"
  );
  yield deepequal([...product()], [[]], "product of zero iterables should yield one empty tuple");
  yield await eventualequal(productAsync(asyncFromArray([1, 2]), [3, 4]), [
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
  ]);
});

await quiz("permutations/permutationsAsync", async function* () {
  yield deepequal(
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
  yield deepequal(
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
  yield deepequal([...permutations([1, 2, 3], 0)], [[]], "r=0 should yield one empty tuple");
  yield await eventualequal(permutationsAsync(asyncFromArray([1, 2, 3]), 2), [
    [1, 2],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 2],
  ]);
});

await quiz("combinations/combinationsAsync", async function* () {
  yield deepequal(
    [...combinations([1, 2, 3], 2)],
    [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    "should yield all r-length combinations without replacement"
  );
  yield deepequal([...combinations([1, 2], 5)], [], "r > n should yield nothing");
  yield deepequal([...combinations([1, 2, 3], 0)], [[]], "r=0 should yield one empty tuple");
  yield await eventualequal(combinationsAsync(asyncFromArray([1, 2, 3]), 2), [
    [1, 2],
    [1, 3],
    [2, 3],
  ]);
});

await quiz("combinationsWithReplacement/combinationsWithReplacementAsync", async function* () {
  yield deepequal(
    [...combinationsWithReplacement([1, 2], 2)],
    [
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    "should yield all r-length combinations, allowing repeats"
  );
  yield await eventualequal(combinationsWithReplacementAsync(asyncFromArray([1, 2]), 2), [
    [1, 1],
    [1, 2],
    [2, 2],
  ]);
});
