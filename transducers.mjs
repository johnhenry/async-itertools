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
 * Create a transducer that groups items by quantity before emitting.
 * Note: this currently returns arrays -- would sets make more sense?
 * @kind function
 * @name group
 * @param {number} limit size of group
 * @returns transducer
 */
export const group = (limit) => (conjoin) => {
  const partition = [];
  return (init, item) => {
    partition.push(item);
    if (partition.length === limit) {
      const subPartition = [];
      for (let i = 0; i < limit; i++) {
        subPartition.push(partition.shift());
      }
      return conjoin(init, subPartition);
    }
    return init;
  };
};

/**
 * Create a transducer that accumulates items into a result and emits them
 * Similar to #Array.reduce
 * @kind function
 * @name take
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
