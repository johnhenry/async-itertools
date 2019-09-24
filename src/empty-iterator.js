import { conjoinSync, conjoinAsync } from './iterator-tools.js';
/**
 * "The" Empty Iterator
 *  Immediately finishes and yields nothing.
 */
export const emptySync = conjoinSync();
/**
 * "The" Empty Asynchronous Iterator
 *  Immediately finishes and yields nothing.
 */
export const emptyAsync = conjoinAsync();
