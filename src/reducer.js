import { HAULT } from './transduction-tools.js';

/**
 * Reduce function for iterators -- appends items to iterator
 * Returns iterator if no items are passed
 * Returns empty iterator if nothing is passed
 * @iterator
 * @reduce
 * @init
 * @return
 */

const reduce = function* (iterator, reduce, init, ignore_hault = false) {
    for (const item of iterator) {
        init = reduce(init, item, iterator);
        if (!ignore_hault && init === HAULT){
            break;
        }
        yield* init;
    }
};

/**
 * Reduce function for iterators -- appends items to iterator
 * Returns iterator if no items are passed
 * Returns empty iterator if nothing is passed
 * @iterator
 * @reduce
 * @init
 * @return
 */

const reduceAsync = async function* (iterator, reduce, init, ignore_hault = false) {
    for await (const item of iterator) {
        init = reduce(init, item, iterator);
        if(!ignore_hault && init === HAULT){
            break;
        }
        yield* init;
    }
};

export{
    reduce,
    reduceAsync,
    HAULT
};
