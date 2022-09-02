import { AsyncChannel } from "./async-channel.mjs";
import { iterateSync } from "./number.mjs";

/**
 * Create a function that tees a emitted items to n iterators
 * Note: This may actually not work due to iterators being "pull" streams
 * @kind function
 * @name teeAsync
 * @param {number} num number iterators to create
 * @returns function
 * @example <caption>Split an iterator into 4 </caption>
 * ```javascript
 * import { teeAsync, number } from '...';
 * const streams = teeAsync(4)(number)
 * for await (const num of streams[0]){
 *   console.info(num);
 * };
 * for await (const num of streams[1]){
 *   console.log(num);
 * };
 * for await (const num of streams[2]){
 *   console.warn(num);
 * };
 * for await (const num of streams[3]){
 *   console.error(num);
 * };
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

/**
 * Tee Asynnchronous Iterator
 * @kind function
 * @name
 */
export const teeAsync = (num) => (asyncIterator) => {
  const iterators = [];
  for (const [,] of iterateSync(num)) {
    iterators.push(new AsyncChannel());
  }
  setTimeout(async () => {
    for await (const item of asyncIterator) {
      for (const iterator of iterators) {
        await iterator.put(item);
      }
    }
  });
  return iterators;
};
