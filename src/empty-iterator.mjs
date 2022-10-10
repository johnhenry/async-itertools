import { conjoinSync, conjoinAsync } from "./iterator-tools.mjs";
/**
 * "The" Empty Iterator
 *  Immediately finishes and yields nothing.
 * @kind function
 * @name emptySync
 */

export const emptySync = conjoinSync();

/**
 * "The" Empty Asynchronous Iterator
 *  Immediately finishes and yields nothing.
 * @kind function
 * @name emptySync
 */
export const emptyAsync = conjoinAsync();
