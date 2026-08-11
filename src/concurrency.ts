/**
 * Bounded-concurrency helpers: mapConcurrentAsync (parallel map over an
 * (a)sync iterable with a concurrency limit) and prefetchAsync (eager
 * read-ahead into a bounded buffer). Both propagate cancellation/early
 * consumer exit upstream via iterator.return().
 */

import { throwIfAborted, type SignalOptions } from "./abort.ts";

export interface MapConcurrentOptions extends SignalOptions {
  /** Maximum number of `fn` invocations in flight at once (required, >= 1). */
  concurrency: number;
  /**
   * true (default): yield results in input order.
   * false: yield results in completion order.
   */
  ordered?: boolean;
}

const abortErrorOf = (signal: AbortSignal): unknown =>
  signal.reason ?? new DOMException("This operation was aborted", "AbortError");

const getIterator = <T>(
  iterable: AsyncIterable<T> | Iterable<T>
): AsyncIterator<T> | Iterator<T> =>
  Symbol.asyncIterator in Object(iterable)
    ? (iterable as AsyncIterable<T>)[Symbol.asyncIterator]()
    : (iterable as Iterable<T>)[Symbol.iterator]();

/**
 * Map `fn` over `iterable` with up to `concurrency` invocations in flight
 * at once. With `ordered: true` (the default) results are yielded in input
 * order; with `ordered: false` they are yielded in completion order.
 *
 * - Backpressure: at most `concurrency` results are held; the source is
 *   only pulled while there is spare in-flight capacity.
 * - Cancellation: an optional `signal` aborts promptly (rejecting with the
 *   signal's reason, an "AbortError" DOMException by default) even while
 *   awaiting a slow `fn` or source; the source iterator is closed via
 *   `return()`.
 * - Early exit / error: breaking out of the loop, or an `fn` rejection,
 *   also closes the source via `return()`.
 * @kind function
 * @name mapConcurrentAsync
 */
export const mapConcurrentAsync = async function* <In, Out>(
  fn: (item: In) => Out | Promise<Out>,
  iterable: AsyncIterable<In> | Iterable<In>,
  { concurrency, ordered = true, signal }: MapConcurrentOptions
): AsyncGenerator<Out> {
  if (!(typeof concurrency === "number" && concurrency >= 1)) {
    throw new RangeError("mapConcurrentAsync: concurrency must be >= 1");
  }
  throwIfAborted(signal);
  const it = getIterator(iterable);

  let onAbort: (() => void) | undefined;
  const aborted = signal
    ? new Promise<never>((_, reject) => {
        onAbort = () => reject(abortErrorOf(signal));
        signal.addEventListener("abort", onAbort, { once: true });
      })
    : undefined;
  aborted?.catch(() => {});
  const race = <T>(promise: Promise<T>): Promise<T> =>
    aborted ? Promise.race([promise, aborted]) : promise;

  let sourceDone = false;
  try {
    if (ordered) {
      const queue: Array<Promise<Out>> = [];
      while (true) {
        while (!sourceDone && queue.length < concurrency) {
          const r = await race(Promise.resolve(it.next()));
          if (r.done) {
            sourceDone = true;
            break;
          }
          const task = (async () => fn(r.value))();
          task.catch(() => {}); // handled when shifted; avoid unhandledRejection
          queue.push(task);
        }
        if (queue.length === 0) {
          return;
        }
        yield await race(queue.shift() as Promise<Out>);
      }
    } else {
      type Tagged = [Promise<unknown>, Out];
      const pending = new Set<Promise<Tagged>>();
      const add = (value: In) => {
        let self!: Promise<Tagged>;
        self = (async () => {
          const out = await fn(value);
          return [self, out] as Tagged;
        })();
        self.catch(() => {}); // handled via the race below
        pending.add(self);
      };
      while (true) {
        while (!sourceDone && pending.size < concurrency) {
          const r = await race(Promise.resolve(it.next()));
          if (r.done) {
            sourceDone = true;
            break;
          }
          add(r.value);
        }
        if (pending.size === 0) {
          return;
        }
        const [task, out] = await race(Promise.race(pending));
        pending.delete(task as Promise<Tagged>);
        yield out;
      }
    }
  } finally {
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
    if (!sourceDone && it.return) {
      // Close the source on abort, error, or early consumer exit --
      // fire-and-forget so a hung source can't block the rejection.
      Promise.resolve(it.return()).catch(() => {});
    }
  }
};

/**
 * Eagerly pull up to `n` items ahead of the consumer into a bounded
 * buffer, so a slow consumer overlaps with a slow producer. `n <= 0`
 * degenerates to plain iteration. Early consumer exit (or an error)
 * closes the source via `return()`.
 * @kind function
 * @name prefetchAsync
 */
export const prefetchAsync = async function* <T>(
  n: number,
  iterable: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<T> {
  if (n <= 0) {
    yield* iterable;
    return;
  }
  const it = getIterator(iterable);
  const buffer: Array<Promise<IteratorResult<T>> | IteratorResult<T>> = [];
  let done = false;
  const pull = () => {
    const p = Promise.resolve(it.next());
    p.catch(() => {}); // handled when shifted
    buffer.push(p);
  };
  try {
    for (let i = 0; i < n; i++) {
      pull();
    }
    while (true) {
      const r = await (buffer.shift() as Promise<IteratorResult<T>>);
      if (r.done) {
        done = true;
        return;
      }
      pull(); // keep n reads in flight while the consumer works
      yield r.value;
    }
  } finally {
    if (!done && it.return) {
      Promise.resolve(it.return()).catch(() => {});
    }
  }
};
