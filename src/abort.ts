/**
 * AbortSignal plumbing shared by the async consumers (consumers.ts),
 * transduceAsync (transduce.ts), and the concurrency helpers
 * (concurrency.ts).
 */

/** Options bag accepted by cancellable async operations. */
export interface SignalOptions {
  signal?: AbortSignal;
}

/**
 * The error an aborted operation rejects with: the signal's own `reason`
 * when set (AbortController.abort() defaults it to an "AbortError"
 * DOMException), otherwise a fresh "AbortError" DOMException.
 * @ignore
 */
const abortError = (signal: AbortSignal): unknown =>
  signal.reason ?? new DOMException("This operation was aborted", "AbortError");

/** Throw the signal's abort reason if it has already aborted. */
export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw abortError(signal);
  }
};

/**
 * Wrap an (a)sync iterable so that iteration rejects promptly with an
 * AbortError when `signal` aborts -- even while awaiting a slow source --
 * and `iterator.return()` is propagated to the source on abort, error, or
 * early consumer exit. With no signal, delegates straight through.
 *
 * Note: on abort the source's `return()` is invoked but deliberately not
 * awaited -- an async generator queues `return()` behind its in-flight
 * `next()`, so awaiting it could postpone the rejection indefinitely on a
 * hung source (the very case aborting is for).
 * @kind function
 * @name abortable
 */
export const abortable = async function* <T>(
  iterable: AsyncIterable<T> | Iterable<T>,
  signal?: AbortSignal
): AsyncGenerator<T> {
  if (!signal) {
    yield* iterable;
    return;
  }
  throwIfAborted(signal);
  const it =
    Symbol.asyncIterator in Object(iterable)
      ? (iterable as AsyncIterable<T>)[Symbol.asyncIterator]()
      : (iterable as Iterable<T>)[Symbol.iterator]();
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(abortError(signal));
    signal.addEventListener("abort", onAbort, { once: true });
  });
  // Pre-handle so an abort that never races (e.g. after completion, before
  // listener removal) can't surface as an unhandled rejection.
  aborted.catch(() => {});
  let done = false;
  try {
    while (true) {
      const result = await Promise.race([
        Promise.resolve(it.next()),
        aborted,
      ]);
      if (result.done) {
        done = true;
        return;
      }
      yield result.value;
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (!done && it.return) {
      // Close the source on abort, error, or early consumer exit --
      // fire-and-forget; see note above.
      Promise.resolve(it.return()).catch(() => {});
    }
  }
};
