import {
  conjoinSync,
  conjoinAsync,
  reduceSync,
  reduceAsync,
} from "./iterator-tools.mjs";

import { emptySync, emptyAsync } from "./empty-iterator.mjs";

/**
 * Transduce
 * @kind function
 * @name transduce
 * @ignore
 */
const transduce = (itemCollection, reducer, lastreducer, init, reduce) =>
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
  (conjoin, empty, reduce) =>
  (...functions) =>
  (itemCollection) =>
    transduce(
      itemCollection,
      composeFunctions(...functions),
      conjoin,
      empty,
      reduce
    );

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
 * const {iterateAsync} = number;
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
export const transduceAsync = createCustomTranduce(
  conjoinAsync,
  emptyAsync,
  reduceAsync
);

/**
 * Create a function that transduces a synchronous iterator from a list of transducer function
 * @kind function
 * @name transduceSync
 * @param {...functions[]} transducers list of transducers
 * @see transducers
 * @see transduceAsync
 * @example <caption>Synchronously log transduced numbers </caption>
 * ```javascript
 * import { transduceSync, transducers, number } from '...';
 * const {iterateSync} = number;
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
export const transduceSync = createCustomTranduce(
  conjoinSync,
  emptySync,
  reduceSync
);
