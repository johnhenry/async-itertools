type Numeric = number | bigint;

const count = <N extends Numeric>(zero: N, one: N) =>
  function* (min: N = zero, max?: N, inc: N = one): Generator<N> {
    if (max === undefined) {
      if (min < zero) {
        max = zero;
      } else {
        max = min;
        min = zero;
      }
    }

    if (min < max) {
      for (let i = min; i <= max; i = ((i as number) + (inc as number)) as N) {
        yield i;
      }
    } else if (min > max) {
      for (let i = min; i >= max; i = ((i as number) - (inc as number)) as N) {
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
 * @param min number at which to start iteration
 * @param max number before which to stop iteration
 * @param inc increment
 * @see countAsync
 * @example <caption>Log an infinite sequence of numbers starting with 5 </caption>
 * ```javascript
 * import { countSync } from 'async-itertools';
 * for(const num of countSync(5, Infinity)){
 *   console.log(num);
 * }
 * ```
 */
export const countSync = count<number>(0, 1);
export const countBigSync = count<bigint>(0n, 1n);
/**
 * Create an asynchronous sequence of numbers
 * @kind function
 * @name countAsync
 * @param min number at which to start iteration
 * @param max number before which to stop iteration
 * @param inc increment
 * @see countSync
 * @example <caption>Log an infinite sequence of numbers starting with 5 </caption>
 * ```javascript
 * import { countAsync } from 'async-itertools';
 * for await(const num of countAsync(5, Infinity)){
 *   console.log(num);
 * }
 * ```
 */
export const countAsync = async function* (
  min = 0,
  max?: number,
  inc = 1
): AsyncGenerator<number> {
  yield* countSync(min, max, inc);
};
// min/inc default to undefined here (not 0/1) so countBigSync's own
// BigInt defaults (bound via count(0n, 1n)) actually apply -- a Number
// default of 0/1 would flow straight through and crash the first time
// `min += inc` mixed a BigInt with a Number.
export const countBigAsync = async function* (
  min?: bigint,
  max?: bigint,
  inc?: bigint
): AsyncGenerator<bigint> {
  yield* countBigSync(min, max, inc);
};
