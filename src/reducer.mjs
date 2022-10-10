import { HAULT } from "./iterator-tools.mjs";

/**
 * Reduce function for iterators -- appends items to iterator
 * @kind function
 * @name reduce
 * @param {iterator} iterator iterator
 * @param {function} reduce reducer function
 * @param {*} init initial reduce value
 * @param {boolean} ignore_hault=false ignore when hault is passed
 * @returns iterator if no items are passed; empty iterator if nothing is passed
 * @ignore
 */

const reduce = function* (iterator, reduce, init, ignore_hault = false) {
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
 * @ignore
 */
const reduceAsync = async function* (
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

export { reduce, reduceAsync, HAULT };
