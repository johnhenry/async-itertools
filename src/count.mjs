const count = (zero = 0, one = 1) =>
  function* (min = zero, max, inc = one) {
    if (max === undefined) {
      if (min < zero) {
        max = zero;
      } else {
        max = min;
        min = zero;
      }
    }

    // if (min > max) {
    //   while (min > max) {
    //     yield (min -= inc);
    //   }
    //   yield max;
    //   return;
    // }
    // yield min;
    // while (min < max) {
    //   yield (min += inc);
    // }
    if (min < max) {
      for (let i = min; i <= max; i += inc) {
        yield i;
      }
    } else if (min > max) {
      for (let i = min; i >= max; i -= inc) {
        yield i;
      }
    } else {
      yield min;
    }

    return;
  };

/**
 * Create a sequence of numbers
 * @kind function
 * @name countSync
 * @param {number} min number at which to start iteration
 * @param {number} max number before which to stop iteration
 * @param {number} increment increment
 * @see iterateAsync
 * @example <caption>Log an infinite sequence of numbers starting with 5 </caption>
 * ```javascript
 * import { number } from '...';
 * for(const num of number.countSync(5)){
 * console.log(num);
 * }
 * ```
 */
export const countSync = count();
export const countBigSync = count(0n, 1n);
/**
 * Create an asynchronous sequence of numbers
 * @kind function
 * @name countAsync
 * @param {number} min number at which to start iteration
 * @param {number} max number before which to stop iteration
 * @param {number} increment increment
 * @see countAsync
 * @example <caption>Log an infinite sequence of numbers starting with 5 </caption>
 * ```javascript
 * import { number } from '...';
 * for await(const num of number.iterateAsync(5)){
 * console.log(num);
 * }
 * ```
 */
export const countAsync = async function* (min = 0, max, inc = 1) {
  yield* countSync(min, max, inc);
};
export const countBigAsync = async function* (min = 0, max, inc = 1) {
  yield* countBigSync(min, max, inc);
};
