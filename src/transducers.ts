/**
 * Functions that return transducers
 * @kind namespace
 * @name transducerReturners
 * @see transduceSync
 * @see transduceAsync
 */

import { HALT, type ReducerStep, type Transducer } from "./iterator-tools.ts";

/**
 * Create a transducer that maps values
 * @kind function
 * @name map
 * @param transform transformation function applied to each item
 * @returns transducer
 */
export const map =
  <In, Out>(transform: (item: In) => Out): Transducer<In, Out> =>
  (conjoin) =>
  (init, item) =>
    conjoin(init, transform(item));

/**
 * Create a transducer that filters values
 * @kind function
 * @name filter
 * @param predicate boolean function to determine if an item is emitted
 * @returns transducer
 */
export const filter =
  <In>(predicate: (item: In) => boolean): Transducer<In, In> =>
  (conjoin) =>
  (init, item) =>
    predicate(item) ? conjoin(init, item) : init;

/**
 * Create a transducer that halts after a given number of values
 * @kind function
 * @name take
 * @param limit maximum total items to emit
 * @returns transducer
 */
export const take =
  <In>(limit: number): Transducer<In, In> =>
  (conjoin) => {
    let amount = 0;
    return (init, item) =>
      amount < limit ? (amount++, conjoin(init, item)) : HALT;
  };

/**
 * Create a transducer that drops the first N values
 * before begining to yield
 * @kind function
 * @name drop
 * @param limit number of leading items to drop
 * @returns transducer
 * @see reject
 */
export const drop =
  <In>(limit: number): Transducer<In, In> =>
  (conjoin) => {
    let amount = 0;
    return (init, item) =>
      amount >= limit ? (amount++, conjoin(init, item)) : (amount++, init);
  };

/**
 * Create a transducer that rejects values matching a predicate.
 * The complement of `filter`.
 * @kind function
 * @name reject
 * @param predicate boolean function; matching items are dropped
 * @returns transducer
 * @see filter
 * @see drop
 */
export const reject =
  <In>(predicate: (item: In) => boolean): Transducer<In, In> =>
  (conjoin) =>
  (init, item) =>
    predicate(item) ? init : conjoin(init, item);

/**
 * Create a transducer that groups items by quantity before emitting.
 * Note: this currently returns arrays -- would sets make more sense?
 * Any trailing items that don't fill a complete group are flushed as a
 * final, shorter group when the source iterator completes (see the
 * `.complete` transducer protocol in transduce.ts/iterator-tools.ts).
 * @kind function
 * @name group
 * @param limit size of group
 * @returns transducer
 */
export const group =
  <In>(limit: number): Transducer<In, In[]> =>
  (conjoin) => {
    const partition: In[] = [];
    const step: ReducerStep<In> = (init, item) => {
      partition.push(item);
      if (partition.length === limit) {
        return conjoin(init, partition.splice(0, limit));
      }
      return init;
    };
    step.complete = (init) => {
      const out =
        partition.length > 0 ? conjoin(init, partition.splice(0)) : init;
      const buffer = out === HALT ? init : out;
      return conjoin.complete ? conjoin.complete(buffer) : buffer;
    };
    return step;
  };

/**
 * Create a transducer that accumulates items into a result and emits them
 * Similar to #Array.reduce
 * @kind function
 * @name accumulate
 * @param func accumulation function
 * @param initial initial accumulation value
 * @returns transducer
 */
export const accumulate =
  <In, Acc = In>(
    func: (accumulated: Acc, item: In) => Acc = (a, b) =>
      (a as unknown as number) + (b as unknown as number) as unknown as Acc,
    initial: Acc = 0 as unknown as Acc
  ): Transducer<In, Acc> =>
  (conjoin) =>
  (init, item) => {
    initial = func(initial, item);
    return conjoin(init, initial);
  };

/**
 * Create a transducer that skips consecutive duplicate items (by key).
 * Mirrors the `unique_justseen` recipe documented in Python's itertools
 * docs -- the transducer-pipeline, adjacent-only counterpart to
 * itertools.ts's global, unbounded-memory uniqueSync/uniqueAsync.
 * @kind function
 * @name dedupe
 * @param keyFn maps an item to the key duplicates are compared by
 * @returns transducer
 * @see uniqueSync
 */
export const dedupe =
  <In>(keyFn: (item: In) => unknown = (x) => x): Transducer<In, In> =>
  (conjoin) => {
    let hasLast = false;
    let lastKey: unknown;
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
 * @param separator value inserted between items
 * @returns transducer
 */
export const interpose =
  <In, Sep = In>(separator: Sep): Transducer<In, In | Sep> =>
  (conjoin) => {
    let started = false;
    return (init, item) => {
      if (started) {
        const out = conjoin(init, separator);
        if (out === HALT) {
          return HALT;
        }
        init = out;
      }
      started = true;
      return conjoin(init, item);
    };
  };

/**
 * Create a transducer that groups consecutive items sharing a key into
 * arrays, emitting each completed group as soon as the key changes.
 * The transducer-pipeline counterpart to groupBySync/groupByAsync
 * (itertools.ts); distinct from `group`, above, which chunks by a fixed
 * size rather than by a shared key. Any trailing group is flushed when the
 * source iterator completes, following the same `.complete` protocol as
 * `group`.
 * @kind function
 * @name partitionBy
 * @param keyFn maps an item to the key runs are grouped by
 * @returns transducer
 * @see groupBySync
 * @see group
 */
export const partitionBy =
  <In>(keyFn: (item: In) => unknown = (x) => x): Transducer<In, In[]> =>
  (conjoin) => {
    let hasCurrent = false;
    let currentKey: unknown;
    let bucket: In[] = [];
    const step: ReducerStep<In> = (init, item) => {
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
      const buffer = out === HALT ? init : out;
      return conjoin.complete ? conjoin.complete(buffer) : buffer;
    };
    return step;
  };

/**
 * Create a transducer that calls `fn(item)` for its side effect and passes
 * the item through unchanged. RxJS-style, for debugging/instrumenting a
 * pipeline without altering its values.
 * @kind function
 * @name tap
 * @param fn called with each item, for side effects
 * @returns transducer
 */
export const tap =
  <In>(fn: (item: In) => unknown): Transducer<In, In> =>
  (conjoin) =>
  (init, item) => {
    fn(item);
    return conjoin(init, item);
  };
