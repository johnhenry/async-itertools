import { isIterator, isAsyncIterator } from "./is-iterator.mjs";
import { exhaust } from "./exhaust.mjs";
export const eventualequal = async (a, b) => {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    let length, i, keys;
    if (Array.isArray(a) && Array.isArray(b)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) {
        if (!(await eventualequal(a[i], b[i]))) return false;
      }
      return true;
    }
    if (
      isIterator(a) ||
      isAsyncIterator(a) ||
      isIterator(a) ||
      isAsyncIterator(a)
    ) {
      try {
        return eventualequal(await exhaust(a), await exhaust(b));
      } catch (e) {
        return false;
      }
    }

    if (a.constructor === RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    if (a.valueOf !== Object.prototype.valueOf) {
      return a.valueOf() === b.valueOf();
    }
    if (a.toString !== Object.prototype.toString) {
      return a.toString() === b.toString();
    }

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; ) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    }

    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      if (!eventualequal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
};
