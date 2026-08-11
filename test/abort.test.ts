import { test } from "node:test";
import assert from "node:assert/strict";
import {
  someAsync,
  everyAsync,
  findAsync,
  foldAsync,
  forEachAsync,
  firstAsync,
  lastAsync,
  nthAsync,
  minAsync,
  maxAsync,
  quantifyAsync,
  transduceAsync,
  transducers,
  pause,
} from "../src/index.ts";

const { map } = transducers;

/**
 * A slow, instrumented async source: yields 0, 1, 2, ... with `delay` ms
 * between items, and records whether its finally block ran (i.e. whether
 * iterator.return() was propagated to it).
 */
const slowSource = (delay = 20) => {
  const state = { closed: false, yielded: 0 };
  const iterable = (async function* () {
    try {
      for (let i = 0; ; i++) {
        await pause(delay);
        state.yielded++;
        yield i;
      }
    } finally {
      state.closed = true;
    }
  })();
  return { iterable, state };
};

const isAbortError = (err: unknown): boolean =>
  err instanceof Error && err.name === "AbortError";

test("someAsync rejects with AbortError on mid-stream abort and closes the source", async () => {
  const { iterable, state } = slowSource(15);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 40);
  await assert.rejects(
    someAsync((x: number) => x > 1e9, iterable, { signal: controller.signal }),
    isAbortError,
    "must reject with an AbortError"
  );
  // Give the fire-and-forget return() a beat to land.
  await pause(60);
  assert.strictEqual(state.closed, true, "iterator.return() must reach the source");
  assert.ok(state.yielded >= 1, "some items should have flowed before the abort");
});

test("consumers reject immediately on an already-aborted signal", async () => {
  const signal = AbortSignal.abort();
  const opts = { signal };
  const src = () => slowSource(5).iterable;
  await assert.rejects(someAsync(() => true, src(), opts), isAbortError);
  await assert.rejects(everyAsync(() => true, src(), opts), isAbortError);
  await assert.rejects(findAsync(() => true, src(), opts), isAbortError);
  await assert.rejects(forEachAsync(() => {}, src(), opts), isAbortError);
  await assert.rejects(foldAsync((a: number) => a, 0, src(), opts), isAbortError);
  await assert.rejects(firstAsync(src(), undefined, opts), isAbortError);
  await assert.rejects(lastAsync(src(), undefined, opts), isAbortError);
  await assert.rejects(nthAsync(src(), 1, undefined, opts), isAbortError);
  await assert.rejects(minAsync(src(), undefined, undefined, opts), isAbortError);
  await assert.rejects(maxAsync(src(), undefined, undefined, opts), isAbortError);
  await assert.rejects(quantifyAsync(src(), undefined, opts), isAbortError);
});

test("abort rejects with the signal's custom reason when one is given", async () => {
  const { iterable } = slowSource(15);
  const controller = new AbortController();
  const reason = new Error("deadline exceeded");
  setTimeout(() => controller.abort(reason), 30);
  await assert.rejects(
    lastAsync(iterable, undefined, { signal: controller.signal }),
    (err: unknown) => err === reason,
    "must reject with the exact abort reason"
  );
});

test("consumers still work (and ignore the signal) when never aborted", async () => {
  const controller = new AbortController();
  const opts = { signal: controller.signal };
  const arr = async function* () {
    yield* [3, 1, 2];
  };
  assert.strictEqual(await someAsync((x: number) => x === 2, arr(), opts), true);
  assert.strictEqual(await lastAsync(arr(), undefined, opts), 2);
  assert.strictEqual(await firstAsync(arr(), undefined, opts), 3);
  assert.strictEqual(await nthAsync(arr(), 1, undefined, opts), 1);
  assert.strictEqual(await minAsync(arr(), undefined, undefined, opts), 1);
  assert.strictEqual(await maxAsync(arr(), undefined, undefined, opts), 3);
  assert.strictEqual(await quantifyAsync(arr(), undefined, opts), 3);
  assert.strictEqual(
    await foldAsync((a: number, b: number) => a + b, 0, arr(), opts),
    6
  );
});

test("transduceAsync accepts {signal}: rejects mid-stream and closes the source", async () => {
  const { iterable, state } = slowSource(15);
  const controller = new AbortController();
  const pipeline = transduceAsync(map((x: number) => x + 1));
  setTimeout(() => controller.abort(), 50);
  const seen: number[] = [];
  await assert.rejects(
    (async () => {
      for await (const value of pipeline(iterable, { signal: controller.signal })) {
        seen.push(value);
      }
    })(),
    isAbortError,
    "iteration must reject with an AbortError"
  );
  assert.ok(seen.length >= 1, "items before the abort must still have been emitted");
  await pause(60);
  assert.strictEqual(state.closed, true, "iterator.return() must reach the source");
});

test("transduceAsync without a signal is unchanged", async () => {
  const pipeline = transduceAsync(map((x: number) => x * 10));
  const seen: number[] = [];
  for await (const value of pipeline(
    (async function* () {
      yield* [1, 2, 3];
    })()
  )) {
    seen.push(value);
  }
  assert.deepStrictEqual(seen, [10, 20, 30]);
});
