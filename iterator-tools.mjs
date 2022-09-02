export const HAULT = Symbol();

/**
 * Create a promise that fulfills after a given number of milliseconds
 * The primary purpose of this is to allow pausing of asynchronous functions
 * @kind function
 * @name reduce
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
 * @kind function
 * @name reduce
 * @param {iterator} iterator iterator
 * @param {function} reduce reducer function
 * @param {*} init initial reduce value
 * @param {boolean} ignore_hault=false ignore when hault is passed
 * @returns iterator if no items are passed; empty iterator if nothing is passed
 */
export const reduceSync = function* (
  iterator,
  reduce,
  init,
  ignore_hault = false
) {
  for (const item of iterator) {
    init = reduce(init, item, iterator);
    if (!ignore_hault && init === HAULT) {
      break;
    }
    yield* init;
  }
};

/**
 * Reduce function for asynchronous iterators -- appends items to asynchronous iterator
 * @kind function
 * @name reduceAsync
 * @param {iterator} iterator iterator
 * @param {function} reduce reducer function
 * @param {*} init initial reduce value
 * @param {boolean} ignore_hault ignore when hault is passed
 * @returns iterator if no items are passed; empty iterator if nothing is passed
 */
export const reduceAsync = async function* (
  iterator,
  reduce,
  init,
  ignore_hault = false
) {
  for await (const item of iterator) {
    init = reduce(init, item, iterator);
    if (!ignore_hault && init === HAULT) {
      break;
    }
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
