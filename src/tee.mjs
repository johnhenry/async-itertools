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
const DONE = Symbol("DONE");

// import { AsyncChannel } from "./async-channel.mjs";
// import { countSync } from "./number.mjs";
// const teeAsyncOld = (num) => (asyncIterator) => {
//   const iterators = [];
//   for (const _ of countSync(num)) {
//     iterators.push(new AsyncChannel());
//   }
//   setTimeout(async () => {
//     for await (const item of asyncIterator) {
//       for (const iterator of iterators) {
//         await iterator.put(item);
//       }
//     }
//   });
//   return iterators;
// };

export const teeSync =
  (num = 0) =>
  (iterable) => {
    const source = iterable[Symbol.iterator]();
    const buffers = new Array(num).fill(null).map((_) => []);

    const next = (i) => {
      if (buffers[i].length !== 0) {
        return buffers[i].shift();
      }
      const x = source.next();

      if (x.done) {
        return DONE;
      }

      buffers[1 - i].push(x.value);
      return x.value;
    };

    return buffers.map(function* (_, i) {
      for (;;) {
        const x = next(i);

        if (x === DONE) {
          break;
        }

        yield x;
      }
    });
  };

export const teeAsync =
  (num = 0) =>
  (iterable) => {
    const source = iterable[Symbol.asyncIterator]();
    const buffers = new Array(num).fill(null).map((_) => []);

    const next = async (i) => {
      if (buffers[i].length !== 0) {
        return buffers[i].shift();
      }
      const x = await source.next();

      if (x.done) {
        return DONE;
      }

      buffers[1 - i].push(x.value);
      return x.value;
    };

    return buffers.map(async function* (_, i) {
      for (;;) {
        const x = await next(i);

        if (x === DONE) {
          break;
        }

        yield x;
      }
    });
  };
