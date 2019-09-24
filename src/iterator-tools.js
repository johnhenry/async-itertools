export const HAULT = Symbol();
export const pause = (milliseconds, value) => new Promise(resolve => setTimeout(resolve, milliseconds, value));

/**
 * Reduce function for iterators -- appends items to iterator
 * Returns iterator if no items are passed
 * Returns empty iterator if nothing is passed
 * @iterator
 * @reduce
 * @init
 * @return
 */

export const reduceSync = function* (iterator, reduce, init, ignore_hault = false) {
    for (const item of iterator) {
        init = reduce(init, item, iterator);
        if (!ignore_hault && init === HAULT) {
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

export const reduceAsync = async function* (iterator, reduce, init, ignore_hault = false) {
    for await (const item of iterator) {
        init = reduce(init, item, iterator);
        if (!ignore_hault && init === HAULT) {
            break;
        }
        yield* init;
    }
};


/**
 * Concatination function for iterators -- concatinates iterators
 * Returns empty iterator if nothing is passed
 */
export const concatSync = function* (...iterators) {
    for (const iterator of iterators) {
        yield* iterator;
    }
};

/**
 * Conjoin function for iterators -- appends items to iterator
 * Returns iterator if no items are passed
 * Returns empty iterator if nothing is passed
 * @param iterator - iterator where items are to be conjoined
 * @param itemList - list of items to be conjoined to iterator
 * @return - iterator combined with items from itemList
 */
export const conjoinSync = function* (iterator, ...itemList) {
    if(iterator){
        yield* iterator;
    }
    yield* itemList;
};


/**
 * Concatination function for iterators -- concatinates iterators
 * Returns empty iterator if nothing is passed
 */
export const concatAsync = async function* (...iterators) {
    for (const iterator of iterators) {
        yield* iterator;
    }
};

/**
 * Conjoin function for iterators -- appends items to iterator
 * Returns iterator if no items are passed
 * Returns empty iterator if nothing is passed
 * @param iterator - iterator where items are to be conjoined
 * @param itemList - list of items to be conjoined to iterator
 * @return - iterator combined with items from itemList
 */
export const conjoinAsync = async function* (iterator, ...itemList) {
    if (iterator) {
        yield* iterator;
    }
    yield* itemList;
};


export const zipSync = function* (...iteratorList) {
    const generators = iteratorList.map(iterator => iterator[Symbol.iterator]());
    outer:
    while (true) {
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

export const run = async (program, render = console.log) => {
    for await (const output of program) {
        await render(output);
    }
};
