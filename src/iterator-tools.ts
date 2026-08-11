import { isAsyncIterator } from "./is-iterator.ts";

/**
 * Sentinel returned by a reducer step to stop consumption of the source
 * iterator (early termination -- see the `take` transducer).
 */
export const HALT: unique symbol = Symbol("HALT");
export type Halt = typeof HALT;

/**
 * @deprecated Misspelled legacy alias of {@link HALT} (pre-2.1 name).
 * Kept for backwards compatibility; prefer HALT.
 */
export { HALT as HAULT };

/**
 * The transducer step protocol (v2.1, "pending-emission buffer").
 *
 * The accumulator is a plain array used as a pending-emission buffer: the
 * innermost step ("emit" -- see transduce.ts) pushes emitted items onto it
 * and returns it. A step may instead return {@link HALT} to terminate
 * consumption of the source early. A stateful step (e.g. `group`,
 * `partitionBy`) may carry a `complete` method, invoked once after the
 * source is exhausted (or halted) to flush buffered state; `complete`
 * implementations must cascade to their inner step's own `complete` (see
 * transducers.ts).
 */
export interface ReducerStep<in In> {
  (
    buffer: unknown[],
    item: In,
    iterator?: Iterable<In> | AsyncIterable<In>
  ): unknown[] | Halt;
  complete?: (buffer: unknown[]) => unknown[];
}

/**
 * A transducer: transforms a step that consumes `Out` items into a step
 * that consumes `In` items. Produced by the factories in transducers.ts
 * (map, filter, take, group, ...), consumed by transduceSync/transduceAsync
 * (left-to-right composition as written).
 */
export type Transducer<In, Out> = (next: ReducerStep<Out>) => ReducerStep<In>;

/**
 * Create a promise that fulfills after a given number of milliseconds
 * The primary purpose of this is to allow pausing of asynchronous functions
 * @kind function
 * @name pause
 * @param milliseconds time in milliseconds before value is resolved
 * @param value value given
 * @returns Promise fulfilled with given value
 * @example <caption>Pause a function for 5000 milliseconds</caption>
 * ```javascript
 * import { pause } from '...';
 * (async ()=>{
 *  console.log('hello');
 *  await pause(5000);
 *  console.log('there.');
 * })();
 * ```
 */
export const pause = <T = undefined>(
  milliseconds: number,
  value?: T
): Promise<T> =>
  new Promise((resolve) =>
    setTimeout(resolve as (value?: T) => void, milliseconds, value)
  );

/**
 * Streaming reduce for iterators -- the engine under transduceSync.
 *
 * Protocol (v2.1): the accumulator (`init`) is a plain array used as a
 * *pending-emission buffer*, not a threaded iterable. The innermost step
 * ("emit" -- see transduce.ts) pushes emitted items onto the buffer and
 * returns it; after each step call the buffer is drained (yielded out and
 * cleared in place). This replaces the v2.0 protocol, in which the
 * accumulator was an iterable that each step wrapped in a fresh generator
 * (`conjoin(init, item)`) -- that formed an ever-growing generator chain
 * retaining ~176 bytes per item processed, i.e. unbounded heap growth on
 * long streams.
 *
 * Preserved semantics:
 * - Left-to-right composition order as written in transduceSync(...fns).
 * - If `step` carries a `.complete(init)` method (the transducer completion
 *   protocol -- see transducers.ts's `group`/`partitionBy`), it is invoked
 *   once after the source iterator is exhausted (or halted), letting
 *   stateful transducers flush buffered state (e.g. a trailing,
 *   under-sized `group`).
 * - HALT early termination: a step returning HALT stops consumption of
 *   the source; emissions buffered during the halting step itself are
 *   discarded (as in v2.0, where the halting step's accumulator chain was
 *   dropped), then `.complete` still flushes.
 * @kind function
 * @name reduceSync
 * @param iterator source iterable
 * @param step reducer/transducer step function
 * @param init pending-emission buffer (defaults to a fresh array)
 * @param ignore_halt ignore when HALT is passed
 * @returns generator yielding each emitted item
 */
export const reduceSync = function* <In, Out = unknown>(
  iterator: Iterable<In>,
  step: ReducerStep<In>,
  init: unknown[] = [],
  ignore_halt = false
): Generator<Out> {
  for (const item of iterator) {
    const next = step(init, item, iterator);
    if (!ignore_halt && next === HALT) {
      init.length = 0;
      break;
    }
    init = next as unknown[];
    while (init.length > 0) {
      yield init.shift() as Out;
    }
  }
  if (step.complete) {
    init = step.complete(init);
    while (init.length > 0) {
      yield init.shift() as Out;
    }
  }
};

/**
 * Streaming reduce for asynchronous iterators -- the engine under
 * transduceAsync. See reduceSync for the pending-emission-buffer protocol
 * (v2.1), the `.complete` flush protocol, and HALT semantics -- all
 * identical here, just async.
 * @kind function
 * @name reduceAsync
 * @param iterator source (async) iterable
 * @param step reducer/transducer step function
 * @param init pending-emission buffer (defaults to a fresh array)
 * @param ignore_halt ignore when HALT is passed
 * @returns async generator yielding each emitted item
 */
export const reduceAsync = async function* <In, Out = unknown>(
  iterator: AsyncIterable<In> | Iterable<In>,
  step: ReducerStep<In>,
  init: unknown[] = [],
  ignore_halt = false
): AsyncGenerator<Out> {
  for await (const item of iterator) {
    const next = step(init, item, iterator);
    if (!ignore_halt && next === HALT) {
      init.length = 0;
      break;
    }
    init = next as unknown[];
    while (init.length > 0) {
      yield init.shift() as Out;
    }
  }
  if (step.complete) {
    init = step.complete(init);
    while (init.length > 0) {
      yield init.shift() as Out;
    }
  }
};

/**
 * Concatinates sequence of synchronous iterables
 * @kind function
 * @name concatSync
 * @param iterators iterators
 * @returns iterator generating sequence of combined from given iterables; empty iterator if nothing is passed
 */
export const concatSync = function* <T>(
  ...iterators: Array<Iterable<T>>
): Generator<T> {
  for (const iterator of iterators) {
    yield* iterator;
  }
};

/**
 * Appends items to synchronous iterator
 * @kind function
 * @name conjoinSync
 * @param iterator iterator
 * @param itemList items to be appended
 * @returns copy of initial iterator with items appended
 */
export const conjoinSync = function* <T>(
  iterator?: Iterable<T>,
  ...itemList: T[]
): Generator<T> {
  if (iterator) {
    yield* iterator;
  }
  yield* itemList;
};

/**
 * Concatinates sequence of asynchronous iterables
 * @kind function
 * @name concatAsync
 * @param iterators iterators
 * @returns iterator generating sequence of combined from given iterables; empty iterator if nothing is passed
 */
export const concatAsync = async function* <T>(
  ...iterators: Array<AsyncIterable<T> | Iterable<T>>
): AsyncGenerator<T> {
  for (const iterator of iterators) {
    yield* iterator;
  }
};

/**
 * Appends items to asynchronous iterator
 * @kind function
 * @name conjoinAsync
 * @param iterator iterator
 * @param itemList items to be appended
 * @returns copy of initial iterator with items appended
 */
export const conjoinAsync = async function* <T>(
  iterator?: AsyncIterable<T> | Iterable<T>,
  ...itemList: T[]
): AsyncGenerator<T> {
  if (iterator) {
    yield* iterator;
  }
  yield* itemList;
};

/**
 * Zips synchronous iterators
 * @kind function
 * @name zipSync
 * @param iteratorList iterators
 * @returns an iterator who's members are the members of the given iterators zipped sequencially
 */
export const zipSync = function* <T>(
  ...iteratorList: Array<Iterable<T>>
): Generator<T[]> {
  const generators = iteratorList.map((iterator) =>
    iterator[Symbol.iterator]()
  );
  outer: while (true) {
    const result: T[] = [];
    for (const generator of generators) {
      const { value, done } = generator.next();
      if (done) {
        break outer;
      }
      result.push(value);
    }
    yield result;
  }
};

/**
 * Zips asynchronous iterators (dual of zipSync).
 * Pulls the next value from every input in parallel each round (rather than
 * sequentially awaiting one at a time), stopping as soon as any input is
 * exhausted -- matching zipSync's stop-at-shortest semantics.
 * @kind function
 * @name zipAsync
 * @param iteratorList (async or sync) iterators
 * @returns an async iterator who's members are the members of the given iterators zipped sequencially
 */
export const zipAsync = async function* <T>(
  ...iteratorList: Array<AsyncIterable<T> | Iterable<T>>
): AsyncGenerator<T[]> {
  const generators = iteratorList.map((iterator) =>
    isAsyncIterator(iterator)
      ? (iterator as AsyncIterable<T>)[Symbol.asyncIterator]()
      : (iterator as Iterable<T>)[Symbol.iterator]()
  );
  while (true) {
    const results = await Promise.all(generators.map((g) => g.next()));
    if (results.some(({ done }) => done)) {
      break;
    }
    yield results.map(({ value }) => value as T);
  }
};

/**
 * "run" iterator as a program
 * @kind function
 * @name run
 * @param program iterator
 * @param render function to render output from iterator
 */
export const run = async <T>(
  program: AsyncIterable<T> | Iterable<T>,
  render: (output: T) => unknown = console.log
): Promise<void> => {
  for await (const output of program) {
    await render(output);
  }
};

export const syncFrom = function* <T>(...stuff: T[]): Generator<T> {
  for (const thing of stuff) {
    yield thing;
  }
};
export const asyncFrom = async function* <T>(...stuff: T[]): AsyncGenerator<T> {
  for (const thing of stuff) {
    yield thing;
  }
};
