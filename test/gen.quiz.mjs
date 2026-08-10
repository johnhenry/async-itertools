import quiz, { equal } from "pop-quiz";
import {
  countSync,
  countAsync,
  countBigSync,
  countBigAsync,
  syncFrom,
  asyncFrom,
} from "../index.mjs";
import eventualequal from "../assertions/eventualequal.mjs";

// Regression: countSync et al. used to only be reachable via a `count`
// namespace object (`import { count } from "../index.mjs"; count.countSync`),
// which contradicted the readme's documented top-level import and left
// `countSync` undefined at the package root.
await quiz("countSync is exported at the package root (regression)", function* () {
  yield equal(typeof countSync, "function", "countSync must be a top-level export");
  yield equal(typeof countAsync, "function", "countAsync must be a top-level export");
  yield equal(typeof countBigSync, "function", "countBigSync must be a top-level export");
  yield equal(typeof countBigAsync, "function", "countBigAsync must be a top-level export");
});
await quiz("countSync should produce", async function* () {
  yield await eventualequal(countSync(0, 1), [0, 1]);
  yield await eventualequal(countSync(2, 0), [2, 1, 0]);
  yield await eventualequal(countBigSync(0n, 1n), [0n, 1n]);
  yield await eventualequal(countBigSync(2n, 0n), [2n, 1n, 0n]);
});

// Regression: countBigAsync(min, max, inc) previously defaulted its own
// min/inc parameters to plain Numbers (0/1), which override countBigSync's
// correct BigInt defaults (0n/1n) whenever an argument isn't explicitly
// given -- so countBigAsync(3n) yielded 0n and then threw "Cannot mix
// BigInt and other types". countAsync had no such bug, but wasn't tested
// here either -- both directions are covered now.
await quiz("countAsync/countBigAsync should produce", async function* () {
  yield await eventualequal(countAsync(0, 1), [0, 1]);
  yield await eventualequal(countAsync(2, 0), [2, 1, 0]);
  yield await eventualequal(countBigAsync(0n, 1n), [0n, 1n]);
  yield await eventualequal(countBigAsync(2n, 0n), [2n, 1n, 0n]);
  yield await eventualequal(countBigAsync(3n), [0n, 1n, 2n, 3n]);
});

await quiz("syncFrom should produce", async function* () {
  yield await eventualequal(syncFrom(0, 1), [0, 1]);
  yield await eventualequal(syncFrom(2, 0), [2, 0]);
});

await quiz("asyncFrom should produce", async function* () {
  yield await eventualequal(asyncFrom(0, 1), [0, 1]);
  yield await eventualequal(asyncFrom(2, 0), [2, 0]);
});
