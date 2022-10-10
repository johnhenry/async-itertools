import quiz from "pop-quiz";
import { count, syncFrom, asyncFrom } from "../index.mjs";
const { countSync, countBigSync } = count;
import eventualequal from "../assertions/eventualequal.mjs";
await quiz("countSync should produce", async function* () {
  yield await eventualequal(countSync(0, 1), [0, 1]);
  yield await eventualequal(countSync(2, 0), [2, 1, 0]);
  yield await eventualequal(countBigSync(0n, 1n), [0n, 1n]);
  yield await eventualequal(countBigSync(2n, 0n), [2n, 1n, 0n]);
});

await quiz("syncFrom should produce", async function* () {
  yield await eventualequal(syncFrom(0, 1), [0, 1]);
  yield await eventualequal(syncFrom(2, 0), [2, 0]);
});

await quiz("asyncFrom should produce", async function* () {
  yield await eventualequal(asyncFrom(0, 1), [0, 1]);
  yield await eventualequal(asyncFrom(2, 0), [2, 0]);
});
