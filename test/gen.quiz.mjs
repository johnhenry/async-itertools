import quiz from "pop-quiz";
import { count, syncFrom, asyncFrom } from "../index.mjs";
const { countSync, countAsync, countBigSync, countBigAsync } = count;
import eventualequal from "../assertions/eventualequal.mjs";
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
