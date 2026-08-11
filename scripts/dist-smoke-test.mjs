#!/usr/bin/env node
// Smoke test for the compiled dist/ output: imports the built package
// entry (and a couple of subpath modules) exactly the way a consumer
// would, and exercises a representative slice of the API. Run via
// `npm run test:build` after `npm run build`.
import assert from "node:assert/strict";

const index = await import("../dist/index.js");
const { transduceSync, transducers, countSync, AsyncChannel, HALT, HAULT } =
  index;
const { map, take, group } = transducers;

// transduce pipeline through the built output
assert.deepStrictEqual(
  [...transduceSync(map((x) => x * 2), take(3))(countSync(1, 100))],
  [2, 4, 6],
  "dist transduceSync(map, take) must work"
);
assert.deepStrictEqual(
  [...transduceSync(group(2))([1, 2, 3])],
  [[1, 2], [3]],
  "dist group must flush its trailing partial chunk"
);
assert.strictEqual(typeof HALT, "symbol", "HALT must be exported");
assert.strictEqual(HAULT, HALT, "deprecated HAULT alias must equal HALT");

// channel round-trip
const channel = new AsyncChannel();
await channel.put(1);
await channel.put(2);
await channel.break();
const seen = [];
for await (const item of channel) seen.push(item);
assert.deepStrictEqual(seen, [1, 2], "dist AsyncChannel round-trip");

// subpath modules resolve out of dist via the exports map
const { permutations } = await import("async-itertools/combinatorics");
assert.strictEqual([...permutations([1, 2, 3])].length, 6);
const assertion = await import("async-itertools/pop-quiz/asserteventualequal");
assert.strictEqual(typeof assertion.default, "function");

console.log("dist smoke test passed");
