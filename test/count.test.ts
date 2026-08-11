import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countSync,
  countAsync,
  countBigSync,
  countBigAsync,
  syncFrom,
  asyncFrom,
} from "../src/index.ts";
import { eventualEqual } from "./helpers.ts";

// Regression: countSync et al. used to only be reachable via a `count`
// namespace object (`import { count } from "../index.mjs"; count.countSync`),
// which contradicted the readme's documented top-level import and left
// `countSync` undefined at the package root.
test("countSync is exported at the package root (regression)", () => {
  assert.strictEqual(typeof countSync, "function", "countSync must be a top-level export");
  assert.strictEqual(typeof countAsync, "function", "countAsync must be a top-level export");
  assert.strictEqual(typeof countBigSync, "function", "countBigSync must be a top-level export");
  assert.strictEqual(typeof countBigAsync, "function", "countBigAsync must be a top-level export");
});

test("countSync should produce", async () => {
  await eventualEqual(countSync(0, 1), [0, 1]);
  await eventualEqual(countSync(2, 0), [2, 1, 0]);
  await eventualEqual(countBigSync(0n, 1n), [0n, 1n]);
  await eventualEqual(countBigSync(2n, 0n), [2n, 1n, 0n]);
});

// Regression: countBigAsync(min, max, inc) previously defaulted its own
// min/inc parameters to plain Numbers (0/1), which override countBigSync's
// correct BigInt defaults (0n/1n) whenever an argument isn't explicitly
// given -- so countBigAsync(3n) yielded 0n and then threw "Cannot mix
// BigInt and other types". countAsync had no such bug, but wasn't tested
// here either -- both directions are covered now.
test("countAsync/countBigAsync should produce", async () => {
  await eventualEqual(countAsync(0, 1), [0, 1]);
  await eventualEqual(countAsync(2, 0), [2, 1, 0]);
  await eventualEqual(countBigAsync(0n, 1n), [0n, 1n]);
  await eventualEqual(countBigAsync(2n, 0n), [2n, 1n, 0n]);
  await eventualEqual(countBigAsync(3n), [0n, 1n, 2n, 3n]);
});

test("syncFrom should produce", async () => {
  await eventualEqual(syncFrom(0, 1), [0, 1]);
  await eventualEqual(syncFrom(2, 0), [2, 0]);
});

test("asyncFrom should produce", async () => {
  await eventualEqual(asyncFrom(0, 1), [0, 1]);
  await eventualEqual(asyncFrom(2, 0), [2, 0]);
});
