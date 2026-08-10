/**
 * Functions that return transducers
 * @kind namespace
 * @name transducerReturners
 * @see transduceSync
 * @see transduceAsync
 */

import { HAULT } from "./iterator-tools.mjs";

/**
 * Create a transducer that maps values
 * @kind function
 * @name map
 * @param {function} transform transformation function applied to each item
 * @returns transducer
 */
export const map = (transform) => (conjoin) => (init, item) =>
  conjoin(init, transform(item));

/**
 * Create a transducer that filters values
 * @kind function
 * @name filter
 * @param {function} predicate boolean function to determine if an item is emitted
 * @returns transducer
 */
export const filter = (predicate) => (conjoin) => (init, item) =>
  predicate(item) ? conjoin(init, item) : init;

/**
 * Create a transducer that halts after a given number of values
 * @kind function
 * @name take
 * @param {number} limit maximum total items to emit
 * @returns transducer
 */
export const take = (limit) => (conjoin) => {
  let amount = 0;
  return (init, item) =>
    amount < limit ? (amount++, conjoin(init, item)) : HAULT;
};

/**
 * Create a transducer that drops the first N values
 * before begining to yield
 * @kind function
 * @name drop
 * @param { number } limit number of leading items to drop
 * @returns transducer
 * @see reject
 */
export const drop = (limit) => (conjoin) => {
  let amount = 0;
  return (init, item) =>
    amount >= limit ? (amount++, conjoin(init, item)) : (amount++, init);
};

/**
 * Create a transducer that rejects values matching a predicate.
 * The complement of `filter`.
 * @kind function
 * @name reject
 * @param {function} predicate boolean function; matching items are dropped
 * @returns transducer
 * @see filter
 * @see drop
 */
export const reject = (predicate) => (conjoin) => (init, item) =>
  predicate(item) ? init : conjoin(init, item);

/**
 * Create a transducer that groups items by quantity before emitting.
 * Note: this currently returns arrays -- would sets make more sense?
 * Any trailing items that don't fill a complete group are flushed as a
 * final, shorter group when the source iterator completes (see the
 * `.complete` transducer protocol in transduce.mjs/iterator-tools.mjs).
 * @kind function
 * @name group
 * @param {number} limit size of group
 * @returns transducer
 */
export const group = (limit) => (conjoin) => {
  const partition = [];
  const step = (init, item) => {
    partition.push(item);
    if (partition.length === limit) {
      return conjoin(init, partition.splice(0, limit));
    }
    return init;
  };
  step.complete = (init) => {
    const out = partition.length > 0 ? conjoin(init, partition.splice(0)) : init;
    return conjoin.complete ? conjoin.complete(out) : out;
  };
  return step;
};

/**
 * Create a transducer that accumulates items into a result and emits them
 * Similar to #Array.reduce
 * @kind function
 * @name accumulate
 * @param {function} func accumulation function
 * @param {*} initial initial accumulation value
 * @returns transducer
 */
export const accumulate =
  (func = (a, b) => a + b, initial = 0) =>
  (conjoin) =>
  (init, item) => {
    initial = func(initial, item);
    return conjoin(init, initial);
  };

// https://stats.stackexchange.com/questions/235129/online-estimation-of-variance-with-limited-memory
// const STATS_ACCUMULATOR = [
//     (data, item) => {
//         data.num++;
//         data.current = item;

//         switch (data.num) {
//         case 1:
//             data.sum = data.max = data.min = data.mean = item;
//             break;
//         default:
//             if (item < data.min) {
//                 data.min = item;
//             }
//             if (item > data.max) {
//                 data.max = item;
//             }
//             data.sum += item;
//             data.msq = data.msq || 0;
//             const delta = item - data.mean;
//             data.mean += delta;//is this right ???
//             data.msq += delta * (item - data.mean);
//             data.variance = data.msq / (data.num - 1);
//             break;
//         }

//         return data;
//     },
//     { num: 0 }
// ];
// export const accumulateStats = accumulate(...STATS_ACCUMULATOR);
