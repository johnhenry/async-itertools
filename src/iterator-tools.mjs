import { isAsyncIterator } from "./is-iterator.mjs";

export const HAULT = Symbol();

/**
 * Create a promise that fulfills after a given number of milliseconds
 * The primary purpose of this is to allow pausing of asynchronous functions
 * @kind function
 * @name pause
 * @param {number} milliseconds time in milliseconds befor value is resolved
 * @param {*} value value given
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
export const pause = (milliseconds, value) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds, value));

/**
 * Reduce function for iterators -- appends items to iterator
 * If `step` carries a `.complete(init)` method (the transducer completion
 * protocol -- see transducers.mjs's `group`), it is invoked once after the
 * source iterator is exhausted (or haulted), letting stateful transducers
 * flush any buffered state (e.g. a trailing, under-sized `group`).
 * @kind function
 * @name reduceSync
 * @param {iterator} iterator iterator
 * @param {function} step reducer/transducer step function
 * @param {*} init initial reduce value
 * @param {boolean} ignore_hault=false ignore when hault is passed
 * @returns iterator if no items are passed; empty iterator if nothing is passed
 */
export const reduceSync = function* (
  iterator,
  step,
  init,
  ignore_hault = false
) {
  for (const item of iterator) {
    const next = step(init, item, iterator);
    if (!ignore_hault && next === HAULT) {
      break;
    }
    init = next;
    yield* init;
  }
  if (step.complete) {
    init = step.complete(init);
    yield* init;
  }
};

/**
 * Reduce function for asynchronous iterators -- appends items to asynchronous iterator
 * If `step` carries a `.complete(init)` method (the transducer completion
 * protocol -- see transducers.mjs's `group`), it is invoked once after the
 * source iterator is exhausted (or haulted), letting stateful transducers
 * flush any buffered state (e.g. a trailing, under-sized `group`).
 * @kind function
 * @name reduceAsync
 * @param {iterator} iterator iterator
 * @param {function} step reducer/transducer step function
 * @param {*} init initial reduce value
 * @param {boolean} ignore_hault ignore when hault is passed
 * @returns iterator if no items are passed; empty iterator if nothing is passed
 */
export const reduceAsync = async function* (
  iterator,
  step,
  init,
  ignore_hault = false
) {
  for await (const item of iterator) {
    const next = step(init, item, iterator);
    if (!ignore_hault && next === HAULT) {
      break;
    }
    init = next;
    yield* init;
  }
  if (step.complete) {
    init = step.complete(init);
    yield* init;
  }
};

/**
 * Concatinates sequence of synchronous iterables
 * @kind function
 * @name concatSync
 * @param {iterators} iterators iterators
 * @returns iterator generating sequence of combined from given iterables; empty iterator if nothing is passed
 */

export const concatSync = function* (...iterators) {
  for (const iterator of iterators) {
    yield* iterator;
  }
};

/**
 * Appends items to synchronous iterator
 * @kind function
 * @name conjoinSync
 * @param {iterator} iterator iterator
 * @param {itemList} itemList items to be appended
 * @returns copy of initial iterator with items appended
 */

export const conjoinSync = function* (iterator, ...itemList) {
  if (iterator) {
    yield* iterator;
  }
  yield* itemList;
};

/**
 * Concatinates sequence of asynchronous iterables
 * @kind function
 * @name concatAsync
 * @param {iterators} iterators iterators
 * @returns iterator generating sequence of combined from given iterables; empty iterator if nothing is passed
 */
export const concatAsync = async function* (...iterators) {
  for (const iterator of iterators) {
    yield* iterator;
  }
};

/**
 * Appends items to asynchronous iterator
 * @kind function
 * @name conjoinAsync
 * @param {iterator} iterator iterator
 * @param {itemList} itemList items to be appended
 * @returns copy of initial iterator with items appended
 */
export const conjoinAsync = async function* (iterator, ...itemList) {
  if (iterator) {
    yield* iterator;
  }
  yield* itemList;
};

/**
 * Zips synchronous iterators
 * @kind function
 * @name zipSync
 * @param {iteratorList} iterators iterators
 * @returns an iterator who's members are the members of the given iterators zipped sequencially
 */
export const zipSync = function* (...iteratorList) {
  const generators = iteratorList.map((iterator) =>
    iterator[Symbol.iterator]()
  );
  outer: while (true) {
    const result = [];
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
 * @param {iteratorList} iterators (async or sync) iterators
 * @returns an async iterator who's members are the members of the given iterators zipped sequencially
 */
export const zipAsync = async function* (...iteratorList) {
  const generators = iteratorList.map((iterator) =>
    isAsyncIterator(iterator)
      ? iterator[Symbol.asyncIterator]()
      : iterator[Symbol.iterator]()
  );
  while (true) {
    const results = await Promise.all(generators.map((g) => g.next()));
    if (results.some(({ done }) => done)) {
      break;
    }
    yield results.map(({ value }) => value);
  }
};

/**
 * "run" iterator as a program
 * @kind function
 * @name run
 * @param {iterator} program iterator
 * @param {render} render function to render output from iterator
 */
export const run = async (program, render = console.log) => {
  for await (const output of program) {
    await render(output);
  }
};

export const syncFrom = function* (...stuff) {
  for (const thing of stuff) {
    yield thing;
  }
};
export const asyncFrom = async function* (...stuff) {
  for (const thing of stuff) {
    yield thing;
  }
};
