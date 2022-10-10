export const isIterator = (obj) => typeof obj[Symbol.iterator] === "function";

export const isAsyncIterator = (obj) =>
  typeof obj[Symbol.asyncIterator] === "function";

export const exhaustable = (obj) => isIterator(obj) || isAsyncIterator(obj);

export default exhaustable;
