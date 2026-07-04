import tester, { deepdeepequal } from "../index.mjs";
import TestError from "../testerror.mjs";

// deepdeepequal extends deepequal to correctly compare Map/Set contents
// (deepequal has no visibility into them — neither has own enumerable
// string keys, so two different-content Maps or Sets compare equal
// under plain deepequal) and to tolerate matching circular references.
await tester("Test deepdeepequal", function* () {
  yield deepdeepequal(
    [{ a: true, b: false }],
    [{ b: false, a: true }],
    "deepdeepequal should pass if given arguments are deeply equal"
  );

  const mapA = new Map([
    ["x", 1],
    ["y", 2],
  ]);
  const mapB = new Map([
    ["x", 1],
    ["y", 999],
  ]);
  yield deepdeepequal(mapA, mapB) instanceof TestError
    ? "deepdeepequal should catch differing Map content"
    : new TestError("deepdeepequal should catch differing Map content");

  const setA = new Set([1, 2, 3]);
  const setB = new Set([1, 2, 4]);
  yield deepdeepequal(setA, setB) instanceof TestError
    ? "deepdeepequal should catch differing Set content"
    : new TestError("deepdeepequal should catch differing Set content");

  yield deepdeepequal(
    new Set([{ id: 1 }, { id: 2 }]),
    new Set([{ id: 2 }, { id: 1 }]),
    "deepdeepequal should match Set content regardless of insertion order"
  );

  // matching circular references should not stack-overflow or report unequal
  const circA = { name: "a" };
  circA.self = circA;
  const circB = { name: "a" };
  circB.self = circB;
  yield deepdeepequal(
    circA,
    circB,
    "deepdeepequal should handle matching circular references"
  );
});
