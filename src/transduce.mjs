import { reduceSync, reduceAsync } from "./iterator-tools.mjs";

/**
 * The innermost reducer step ("emit"): pushes an emitted item onto the
 * pending-emission buffer (the accumulator) and returns the buffer.
 * Replaces the v2.0 innermost step (conjoinSync/conjoinAsync), which
 * wrapped the previous accumulator in a fresh generator per item --
 * forming an ever-growing generator chain and leaking ~176 bytes per item
 * on long streams. See reduceSync (iterator-tools.mjs) for the full
 * protocol description.
 * @kind function
 * @name emit
 * @ignore
 */
const emit = (buffer, item) => {
  buffer.push(item);
  return buffer;
};

/**
 * Transduce
 * @kind function
 * @name transduce
 * @ignore
 */
export const transduce = (itemCollection, reducer, lastreducer, init, reduce) =>
  reduce(itemCollection, reducer(lastreducer), init);
/**
 * Compose Functions
 * @kind function
 * @name composeFunctions
 * @ignore
 */
const composeFunctions =
  (...functions) =>
  (input) =>
    functions.reduceRight((input, func) => func(input), input);

/**
 * Create Custom Tranduce
 * @kind function
 * @name createCustomTranduce
 * @ignore
 */
const createCustomTranduce =
  (reduce) =>
  (...functions) =>
  (itemCollection) =>
    transduce(itemCollection, composeFunctions(...functions), emit, [], reduce);

/**
 * Create a function that transduces an asynchronous iterator from a list of transducer function
 * @kind function
 * @name transduceAsync
 * @param {...functions[]} transducers list of transducers
 * @see transducers
 * @see transduceSync
 * @example <caption>Asynchronously log transduced numbers </caption>
 * ```javascript
 * import { transduceAsync, transducers, number } from '...';
 * const {iterateAsync} = count;
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
 * for await (const result of transduce(iterateAsync(Infinity))) {
 *   console.log(result);
 * }
 * ```
 */
export const transduceAsync = createCustomTranduce(reduceAsync);

/**
 * Create a function that transduces a synchronous iterator from a list of transducer function
 * @kind function
 * @name transduceSync
 * @param {...functions[]} transducers list of transducers
 * @see transducers
 * @see transduceAsync
 * @example <caption>Synchronously log transduced numbers </caption>
 * ```javascript
 * import { transduceSync, transducers, count } from '...';
 * const {iterateSync} = count;
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
 * for await (const result of transduce(iterateSync(Infinity))) {
 *   console.log(result);
 * }
 * ```
 */
export const transduceSync = createCustomTranduce(reduceSync);
