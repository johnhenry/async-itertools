import {
    conjoinSync,
    conjoinAsync,
    reduceSync,
    reduceAsync
} from './iterator-tools.js';

import {
    emptySync,
    emptyAsync,
} from './empty-iterator.js';


const transduce = (
    itemCollection,
    reducer,
    lastreducer,
    init,
    reduce) => reduce(itemCollection, reducer(lastreducer), init);

const composeFunctions = (...functions) => (input) =>
    functions.reduceRight((input, func) => func(input), input);

const createCustomTranduce = (conjoin, empty, reduce) => (...functions) => (itemCollection) =>
    transduce(itemCollection, composeFunctions(...functions), conjoin, empty, reduce);

export const transduceSync = createCustomTranduce(
    conjoinSync,
    emptySync,
    reduceSync,
);
export const transduceAsync = createCustomTranduce(
    conjoinAsync,
    emptyAsync,
    reduceAsync,
);
