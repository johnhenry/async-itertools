import {
  reduceSync,
  reduceAsync,
  type ReducerStep,
  type Transducer,
} from "./iterator-tools.ts";
import { abortable, type SignalOptions } from "./abort.ts";

/**
 * The innermost reducer step ("emit"): pushes an emitted item onto the
 * pending-emission buffer (the accumulator) and returns the buffer.
 * Replaces the v2.0 innermost step (conjoinSync/conjoinAsync), which
 * wrapped the previous accumulator in a fresh generator per item --
 * forming an ever-growing generator chain and leaking ~176 bytes per item
 * on long streams. See reduceSync (iterator-tools.ts) for the full
 * protocol description.
 */
const emit: ReducerStep<unknown> = (buffer, item) => {
  buffer.push(item);
  return buffer;
};

/**
 * Transduce -- low-level plumbing kept for protocol experimentation:
 * `reduce(itemCollection, reducer(lastreducer), init)`.
 * @kind function
 * @name transduce
 * @ignore
 */
export const transduce = <Source, Result>(
  itemCollection: Source,
  reducer: (last: ReducerStep<never>) => ReducerStep<never>,
  lastreducer: ReducerStep<never>,
  init: unknown[],
  reduce: (
    itemCollection: Source,
    step: ReducerStep<never>,
    init: unknown[]
  ) => Result
): Result => reduce(itemCollection, reducer(lastreducer), init);

/**
 * Compose Functions
 * @kind function
 * @name composeFunctions
 * @ignore
 */
const composeFunctions =
  (...functions: Array<Transducer<unknown, unknown>>) =>
  (input: ReducerStep<unknown>): ReducerStep<unknown> =>
    functions.reduceRight((input, func) => func(input), input);

/**
 * Create a function that transduces an asynchronous iterator from a list
 * of transducer functions. Transducers compose left to right as written:
 * the first listed transducer sees source items first.
 * @kind function
 * @name transduceAsync
 * @param transducers list of transducers
 * @see transducers
 * @see transduceSync
 * @example <caption>Asynchronously log transduced numbers </caption>
 * ```javascript
 * import { transduceAsync, transducers, countAsync } from 'async-itertools';
 * const {
 *     map,
 *     filter,
 *     take,
 * } = transducers;
 * const LIMIT = 2 ** 2;
 * const transduce = transduceAsync(
 *     filter(x => x % 2),
 *     map(x => x + 1),
 *     take(LIMIT),
 * );
 * for await (const result of transduce(countAsync(Infinity))) {
 *   console.log(result);
 * }
 * ```
 */
export function transduceAsync<A, B>(
  t1: Transducer<A, B>
): (
  itemCollection: AsyncIterable<A> | Iterable<A>,
  options?: SignalOptions
) => AsyncGenerator<B>;
export function transduceAsync<A, B, C>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>
): (
  itemCollection: AsyncIterable<A> | Iterable<A>,
  options?: SignalOptions
) => AsyncGenerator<C>;
export function transduceAsync<A, B, C, D>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>
): (
  itemCollection: AsyncIterable<A> | Iterable<A>,
  options?: SignalOptions
) => AsyncGenerator<D>;
export function transduceAsync<A, B, C, D, E>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>
): (
  itemCollection: AsyncIterable<A> | Iterable<A>,
  options?: SignalOptions
) => AsyncGenerator<E>;
export function transduceAsync<A, B, C, D, E, F>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>
): (
  itemCollection: AsyncIterable<A> | Iterable<A>,
  options?: SignalOptions
) => AsyncGenerator<F>;
export function transduceAsync(
  ...functions: Array<Transducer<any, any>>
): (
  itemCollection: AsyncIterable<unknown> | Iterable<unknown>,
  options?: SignalOptions
) => AsyncGenerator<unknown>;
export function transduceAsync(
  ...functions: Array<Transducer<any, any>>
) {
  return (
    itemCollection: AsyncIterable<unknown> | Iterable<unknown>,
    { signal }: SignalOptions = {}
  ) =>
    reduceAsync(
      signal ? abortable(itemCollection, signal) : itemCollection,
      composeFunctions(...functions)(emit),
      []
    );
}

/**
 * Create a function that transduces a synchronous iterator from a list
 * of transducer functions. Transducers compose left to right as written:
 * the first listed transducer sees source items first.
 * @kind function
 * @name transduceSync
 * @param transducers list of transducers
 * @see transducers
 * @see transduceAsync
 * @example <caption>Synchronously log transduced numbers </caption>
 * ```javascript
 * import { transduceSync, transducers, countSync } from 'async-itertools';
 * const {
 *     map,
 *     filter,
 *     take,
 * } = transducers;
 * const LIMIT = 2 ** 2;
 * const transduce = transduceSync(
 *     filter(x => x % 2),
 *     map(x => x + 1),
 *     take(LIMIT),
 * );
 * for (const result of transduce(countSync(Infinity))) {
 *   console.log(result);
 * }
 * ```
 */
export function transduceSync<A, B>(
  t1: Transducer<A, B>
): (itemCollection: Iterable<A>) => Generator<B>;
export function transduceSync<A, B, C>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>
): (itemCollection: Iterable<A>) => Generator<C>;
export function transduceSync<A, B, C, D>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>
): (itemCollection: Iterable<A>) => Generator<D>;
export function transduceSync<A, B, C, D, E>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>
): (itemCollection: Iterable<A>) => Generator<E>;
export function transduceSync<A, B, C, D, E, F>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>
): (itemCollection: Iterable<A>) => Generator<F>;
export function transduceSync(
  ...functions: Array<Transducer<any, any>>
): (itemCollection: Iterable<unknown>) => Generator<unknown>;
export function transduceSync(
  ...functions: Array<Transducer<any, any>>
) {
  return (itemCollection: Iterable<unknown>) =>
    reduceSync(itemCollection, composeFunctions(...functions)(emit), []);
}
