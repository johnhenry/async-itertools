import { AsyncChannel } from './async-channel.js';
import { iterateSync} from './number.js';

/**
 * Tee Asynnchronous Iterator
 * @kind function
 * @name teeAsync
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
