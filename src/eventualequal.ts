import { isIterator, isAsyncIterator } from "./is-iterator.ts";
import { exhaust } from "./exhaust.ts";

export const eventualequal = async (a: unknown, b: unknown): Promise<boolean> => {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    let length: number, i: number, keys: string[];
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
      isIterator(b) ||
      isAsyncIterator(b)
    ) {
      try {
        return eventualequal(await exhaust(a), await exhaust(b));
      } catch (e) {
        return false;
      }
    }

    if (a.constructor === RegExp) {
      return (
        (a as RegExp).source === (b as RegExp).source &&
        (a as RegExp).flags === (b as RegExp).flags
      );
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
      if (!Object.prototype.hasOwnProperty.call(b, keys[i] as string))
        return false;
    }

    for (i = length; i-- !== 0; ) {
      const key = keys[i] as string;
      if (
        !(await eventualequal(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        ))
      )
        return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
};
