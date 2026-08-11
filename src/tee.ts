/**
 * Create a function that tees emitted items to n iterators
 * @kind function
 * @name teeSync / teeAsync
 * @param num number of iterators to create
 * @returns function
 * @example <caption>Split an iterator into 4 </caption>
 * ```javascript
 * import { teeAsync, countAsync } from 'async-itertools';
 * const streams = teeAsync(4)(countAsync(Infinity))
 * for await (const num of streams[0]){
 *   console.info(num);
 * };
 * ```
 */

const DONE = Symbol("DONE");

export const teeSync =
  (num = 0) =>
  <T>(iterable: Iterable<T>): Array<Generator<T>> => {
    const source = iterable[Symbol.iterator]();
    const buffers: T[][] = new Array(num).fill(null).map(() => []);

    const next = (i: number): T | typeof DONE => {
      const buffer = buffers[i] as T[];
      if (buffer.length !== 0) {
        return buffer.shift() as T;
      }
      const x = source.next();

      if (x.done) {
        return DONE;
      }

      for (let j = 0; j < buffers.length; j++) {
        if (j !== i) (buffers[j] as T[]).push(x.value);
      }
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
  <T>(iterable: AsyncIterable<T>): Array<AsyncGenerator<T>> => {
    const source = iterable[Symbol.asyncIterator]();
    const buffers: T[][] = new Array(num).fill(null).map(() => []);

    const next = async (i: number): Promise<T | typeof DONE> => {
      const buffer = buffers[i] as T[];
      if (buffer.length !== 0) {
        return buffer.shift() as T;
      }
      const x = await source.next();

      if (x.done) {
        return DONE;
      }

      for (let j = 0; j < buffers.length; j++) {
        if (j !== i) (buffers[j] as T[]).push(x.value);
      }
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
