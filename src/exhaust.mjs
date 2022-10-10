import { isIterator, isAsyncIterator } from "./is-iterator.mjs";

export const exhaustSync = (iterator) => {
  return [...iterator];
};
export const exhaustAsync = async (asyncIterator) => {
  const r = [];
  for await (const o of asyncIterator) {
    r.push(o);
  }
  return r;
};

export const exhaust = (obj) => {
  if (isIterator(obj)) {
    return exhaustSync(obj);
  } else if (isAsyncIterator(obj)) {
    return exhaustAsync(obj);
  }
  throw new TypeError(`${obj} is not iterable`);
};

export default exhaust;
