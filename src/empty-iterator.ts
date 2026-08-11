import { conjoinSync, conjoinAsync } from "./iterator-tools.ts";
/**
 * "The" Empty Iterator
 *  Immediately finishes and yields nothing.
 * @kind function
 * @name emptySync
 */

export const emptySync: Generator<never> = conjoinSync<never>();

/**
 * "The" Empty Asynchronous Iterator
 *  Immediately finishes and yields nothing.
 * @kind function
 * @name emptyAsync
 */
export const emptyAsync: AsyncGenerator<never> = conjoinAsync<never>();
