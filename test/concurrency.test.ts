import { test } from "node:test";
import assert from "node:assert/strict";
import { mapConcurrentAsync, prefetchAsync, pause } from "../src/index.ts";

const instrumentedSource = <T>(items: T[], delay = 0) => {
  const state = { closed: false, pulled: 0 };
  const iterable = (async function* () {
    try {
      for (const item of items) {
        if (delay) await pause(delay);
        state.pulled++;
        yield item;
      }
    } finally {
      state.closed = true;
    }
  })();
  return { iterable, state };
};

test("mapConcurrentAsync (ordered) preserves input order", async () => {
  // Reverse delays: earlier items finish later. Order must still hold.
  const delays = [50, 30, 10, 40, 20];
  const out: number[] = [];
  for await (const value of mapConcurrentAsync(
    async (i: number) => {
      await pause(delays[i]!);
      return i * 10;
    },
    [0, 1, 2, 3, 4],
    { concurrency: 5 }
  )) {
    out.push(value);
  }
  assert.deepStrictEqual(out, [0, 10, 20, 30, 40], "input order must be preserved");
});

test("mapConcurrentAsync (unordered) yields in completion order", async () => {
  const delays = [60, 10, 30];
  const out: number[] = [];
  for await (const value of mapConcurrentAsync(
    async (i: number) => {
      await pause(delays[i]!);
      return i;
    },
    [0, 1, 2],
    { concurrency: 3, ordered: false }
  )) {
    out.push(value);
  }
  assert.deepStrictEqual(out, [1, 2, 0], "completion order: fastest first");
});

test("mapConcurrentAsync never exceeds the concurrency limit", async () => {
  let inFlight = 0;
  let peak = 0;
  const out: number[] = [];
  for await (const value of mapConcurrentAsync(
    async (i: number) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await pause(15);
      inFlight--;
      return i;
    },
    [1, 2, 3, 4, 5, 6, 7, 8],
    { concurrency: 3 }
  )) {
    out.push(value);
  }
  assert.deepStrictEqual(out, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(peak <= 3, `at most 3 in flight (saw ${peak})`);
  assert.ok(peak >= 2, `should actually run concurrently (saw ${peak})`);
});

test("mapConcurrentAsync requires a valid concurrency", async () => {
  await assert.rejects(
    // biome-ignore format: single expression
    (async () => {
      for await (const _ of mapConcurrentAsync(
        (x: number) => x,
        [1],
        {} as never
      )) {
        void _;
      }
    })(),
    RangeError
  );
});

test("mapConcurrentAsync propagates early consumer exit to the source", async () => {
  const { iterable, state } = instrumentedSource([1, 2, 3, 4, 5, 6, 7, 8], 5);
  for await (const value of mapConcurrentAsync((x: number) => x, iterable, {
    concurrency: 2,
  })) {
    if (value === 2) break;
  }
  await pause(30);
  assert.strictEqual(state.closed, true, "source must be closed via return()");
  assert.ok(state.pulled < 8, "source must not have been fully drained");
});

test("mapConcurrentAsync propagates fn errors and closes the source", async () => {
  const { iterable, state } = instrumentedSource([1, 2, 3, 4, 5], 5);
  await assert.rejects(
    (async () => {
      for await (const _ of mapConcurrentAsync(
        async (x: number) => {
          if (x === 2) throw new Error("boom");
          return x;
        },
        iterable,
        { concurrency: 2 }
      )) {
        void _;
      }
    })(),
    /boom/
  );
  await pause(30);
  assert.strictEqual(state.closed, true, "source must be closed after fn error");
});

test("mapConcurrentAsync aborts promptly even while fn hangs", async () => {
  const { iterable, state } = instrumentedSource([1, 2, 3], 0);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 30);
  const start = Date.now();
  await assert.rejects(
    (async () => {
      for await (const _ of mapConcurrentAsync(
        () => new Promise<never>(() => {}), // hangs forever
        iterable,
        { concurrency: 2, signal: controller.signal }
      )) {
        void _;
      }
    })(),
    (err: unknown) => err instanceof Error && err.name === "AbortError"
  );
  assert.ok(Date.now() - start < 500, "abort must be prompt, not wait on fn");
  await pause(20);
  assert.strictEqual(state.closed, true, "source must be closed on abort");
});

test("prefetchAsync yields all items in order", async () => {
  const { iterable } = instrumentedSource([1, 2, 3, 4, 5], 5);
  const out: number[] = [];
  for await (const value of prefetchAsync(3, iterable)) {
    out.push(value);
  }
  assert.deepStrictEqual(out, [1, 2, 3, 4, 5]);
});

test("prefetchAsync reads ahead of a slow consumer (bounded)", async () => {
  const { iterable, state } = instrumentedSource([1, 2, 3, 4, 5, 6, 7, 8], 1);
  let maxLead = 0;
  let consumed = 0;
  for await (const value of prefetchAsync(3, iterable)) {
    consumed++;
    await pause(15); // slow consumer: producer should run ahead
    maxLead = Math.max(maxLead, state.pulled - consumed);
    void value;
  }
  assert.ok(maxLead >= 2, `producer should read ahead (lead ${maxLead})`);
  assert.ok(maxLead <= 4, `read-ahead must stay bounded near n (lead ${maxLead})`);
});

test("prefetchAsync(0) degenerates to plain iteration", async () => {
  const out: number[] = [];
  for await (const value of prefetchAsync(0, (async function* () {
    yield* [1, 2, 3];
  })())) {
    out.push(value);
  }
  assert.deepStrictEqual(out, [1, 2, 3]);
});

test("prefetchAsync propagates early consumer exit to the source", async () => {
  const { iterable, state } = instrumentedSource([1, 2, 3, 4, 5, 6, 7, 8], 5);
  for await (const value of prefetchAsync(2, iterable)) {
    if (value === 2) break;
  }
  await pause(40);
  assert.strictEqual(state.closed, true, "source must be closed via return()");
  assert.ok(state.pulled < 8, "source must not have been fully drained");
});
