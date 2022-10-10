import tester, { deepdeepequal } from "../index.mjs";

await tester("Test assertions", function* () {
  yield deepdeepequal(
    [{ a: true, b: false }],
    [{ b: false, a: true }],
    "deepdeepequal should pass if given arguments are deeply equal"
  );
});
