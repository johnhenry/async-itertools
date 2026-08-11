import { test } from "node:test";
import assert from "node:assert/strict";
import { asyncFrom } from "../src/index.ts";
import { eventualequal } from "../src/eventualequal.ts";
import assertEventualEqual, {
  TestError,
  DefaultMessage,
} from "../src/assertions/eventualequal.ts";

test("eventualequal resolves true for eventually-equal async iterables", async () => {
  const a = asyncFrom(1, 2, 3);
  const b = asyncFrom(1, 2, 3);
  assert.strictEqual(
    await eventualequal(a, b),
    true,
    "eventualequal should pass if given arguments are eventually equal"
  );
});

test("eventualequal resolves false for differing async iterables", async () => {
  assert.strictEqual(await eventualequal(asyncFrom(1, 2, 3), asyncFrom(1, 2, 4)), false);
  assert.strictEqual(await eventualequal(asyncFrom(1, 2, 3), asyncFrom(1, 2)), false);
});

// The "async-itertools/pop-quiz/asserteventualequal" subpath export must
// keep working even though pop-quiz itself is no longer a dependency: it
// returns the message on success, and a TestError (Error subclass carrying
// actual/expected/operator on .val, iterable over its entries) on failure.
test("assertion module keeps its pop-quiz-compatible contract", async () => {
  const pass = await assertEventualEqual(asyncFrom(1, 2), [1, 2]);
  assert.strictEqual(pass, DefaultMessage, "success returns the message string");

  const source = asyncFrom(1, 2);
  const fail = await assertEventualEqual(source, [1, 3], "nope");
  assert.ok(fail instanceof TestError, "failure returns a TestError");
  assert.ok(fail instanceof Error, "TestError extends Error");
  assert.strictEqual((fail as TestError).message, "nope");
  const entries = Object.fromEntries(fail as TestError);
  assert.strictEqual(entries.actual, source, "TestError carries the original actual");
  assert.deepStrictEqual(entries.expected, [1, 3], "TestError carries expected");
  assert.strictEqual(entries.operator, "eventualequal");
});
