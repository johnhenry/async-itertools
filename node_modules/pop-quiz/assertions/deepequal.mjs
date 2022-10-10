import TestError from "../testerror.mjs";
// https://deno.land/x/cotton@v0.6.3/src/utils/deepequal.ts
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
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
      var key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
};
export const DefaultMessage = "should be deep equal";
export default (
  actual,
  expected,
  message = DefaultMessage,
  operator = "deepequal"
) => {
  if (deepEqual(actual, expected)) {
    return message;
  }
  return new TestError(message, {
    actual: JSON.stringify(actual),
    expected: JSON.stringify(expected),
    operator,
  });
};
