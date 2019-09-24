import tape from 'tape';
import { transduceSync, transduceAsync, transducers, number } from '../dist/esm/index.js';
const {iterateSync, iterateAsync} = number;
const {
    map,
    filter,
    take,
} = transducers;
const LIMIT = 2 ** 2;
////////
// Example Application Transduction
////////

(async () => {
    await tape('iterator', ({ plan, equal }) => {
        {
            const transduce = transduceSync(
                filter(x => x % 2),
                map(x => x + 1),
                take(LIMIT),
            );
            let i = 0;
            plan(LIMIT);
            for(const result of transduce(iterateSync(Infinity))) {
                equal(result, i += 2, `it should yield "${result}" at index ${i / 2 - 1}`);
            }
        }
    });
    ////////
    // Example Application Asynchronous Transduction
    ////////
    await tape('async-iterator', async ({ plan, equal }) => {
        {
            const transduce = transduceAsync(
                filter(x => x % 2),
                map(x => x + 1),
                take(LIMIT),
            );
            let i = 0;
            plan(LIMIT);
            for await (const result of transduce(iterateAsync(Infinity))) {
                equal(result, i += 2, `it should yield "${result}" at index ${i / 2 - 1}`);
            }
        }
    });
})();
