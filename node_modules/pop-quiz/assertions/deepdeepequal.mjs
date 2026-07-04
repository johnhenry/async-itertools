import TestError from "../testerror.mjs";

// Like deepequal, but also handles cases deepequal silently gets wrong:
//   - Map/Set have no own enumerable string keys, so deepequal's
//     Object.keys() comparison sees two different-content Maps (or Sets)
//     as "equal" (both compare as 0 keys === 0 keys).
//   - Circular references: deepequal recurses forever (stack overflow).
//     `seen` tracks (a, b) pairs already being compared on the current
//     path, so a cycle that lines up on both sides is treated as equal.
const deepDeepEqual = (a, b, seen) => {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) return false;

    let bSeen = seen.get(a);
    if (bSeen) {
      if (bSeen.has(b)) return true;
    } else {
      bSeen = new Set();
      seen.set(a, bSeen);
    }
    bSeen.add(b);

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = a.length; i-- !== 0; ) {
        if (!deepDeepEqual(a[i], b[i], seen)) return false;
      }
      return true;
    }

    if (a instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, value] of a) {
        if (!b.has(key)) return false;
        if (!deepDeepEqual(value, b.get(key), seen)) return false;
      }
      return true;
    }

    if (a instanceof Set) {
      if (a.size !== b.size) return false;
      for (const value of a) {
        let found = false;
        for (const candidate of b) {
          if (deepDeepEqual(value, candidate, seen)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
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

    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    }
    for (const key of keys) {
      if (!deepDeepEqual(a[key], b[key], seen)) return false;
    }
    return true;
  }
  return a !== a && b !== b;
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, (_key, v) =>
      v instanceof Map
        ? { __map__: [...v.entries()] }
        : v instanceof Set
          ? { __set__: [...v.values()] }
          : v
    );
  } catch {
    return String(value);
  }
};

export const DefaultMessage = "should be deeply-deeply equal";
export default (
  actual,
  expected,
  message = DefaultMessage,
  operator = "deepdeepequal"
) => {
  if (deepDeepEqual(actual, expected, new Map())) {
    return message;
  }
  return new TestError(message, {
    actual: safeStringify(actual),
    expected: safeStringify(expected),
    operator,
  });
};
