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

/**
 * Create a transducer that skips consecutive duplicate items (by key).
 * Mirrors the `unique_justseen` recipe documented in Python's itertools
 * docs -- the transducer-pipeline, adjacent-only counterpart to
 * itertools.mjs's global, unbounded-memory uniqueSync/uniqueAsync.
 * @kind function
 * @name dedupe
 * @param {function} keyFn maps an item to the key duplicates are compared by
 * @returns transducer
 * @see uniqueSync
 */
export const dedupe =
  (keyFn = (x) => x) =>
  (conjoin) => {
    let hasLast = false;
    let lastKey;
    return (init, item) => {
      const key = keyFn(item);
      if (hasLast && Object.is(key, lastKey)) {
        return init;
      }
      hasLast = true;
      lastKey = key;
      return conjoin(init, item);
    };
  };

/**
 * Create a transducer that inserts `separator` between consecutive
 * emitted items -- not before the first item, and not after the last.
 * @kind function
 * @name interpose
 * @param {*} separator value inserted between items
 * @returns transducer
 */
export const interpose = (separator) => (conjoin) => {
  let started = false;
  return (init, item) => {
    if (started) {
      init = conjoin(init, separator);
    }
    started = true;
    return conjoin(init, item);
  };
};

/**
 * Create a transducer that groups consecutive items sharing a key into
 * arrays, emitting each completed group as soon as the key changes.
 * The transducer-pipeline counterpart to groupBySync/groupByAsync
 * (itertools.mjs); distinct from `group`, above, which chunks by a fixed
 * size rather than by a shared key. Any trailing group is flushed when the
 * source iterator completes, following the same `.complete` protocol as
 * `group`.
 * @kind function
 * @name partitionBy
 * @param {function} keyFn maps an item to the key runs are grouped by
 * @returns transducer
 * @see groupBySync
 * @see group
 */
export const partitionBy =
  (keyFn = (x) => x) =>
  (conjoin) => {
    let hasCurrent = false;
    let currentKey;
    let bucket = [];
    const step = (init, item) => {
      const key = keyFn(item);
      if (!hasCurrent) {
        hasCurrent = true;
        currentKey = key;
        bucket = [item];
        return init;
      }
      if (Object.is(key, currentKey)) {
        bucket.push(item);
        return init;
      }
      const out = conjoin(init, bucket);
      currentKey = key;
      bucket = [item];
      return out;
    };
    step.complete = (init) => {
      const out = bucket.length > 0 ? conjoin(init, bucket) : init;
      return conjoin.complete ? conjoin.complete(out) : out;
    };
    return step;
  };

/**
 * Create a transducer that calls `fn(item)` for its side effect and passes
 * the item through unchanged. RxJS-style, for debugging/instrumenting a
 * pipeline without altering its values.
 * @kind function
 * @name tap
 * @param {function} fn called with each item, for side effects
 * @returns transducer
 */
export const tap = (fn) => (conjoin) => (init, item) => {
  fn(item);
  return conjoin(init, item);
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
