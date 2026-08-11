// Historically this module was a pop-quiz assertion and imported
// pop-quiz/testerror. pop-quiz is no longer a dependency (the test suite
// moved to node:test), so a structurally-compatible TestError is inlined
// here to keep the "async-itertools/pop-quiz/asserteventualequal" subpath
// export working for existing consumers: it extends Error, exposes the
// details on `.val`, and is iterable over the [key, value] entries --
// exactly the shape pop-quiz@1's TestError had.
import { eventualequal } from "../eventualequal.ts";

export class TestError extends Error {
  val: Record<string, unknown>;
  constructor(message: string, val: Record<string, unknown> = {}) {
    super(message);
    this.val = val;
  }
  [Symbol.iterator](): IterableIterator<[string, unknown]> {
    return Object.entries(this.val).values();
  }
}

export const DefaultMessage = "should eventually be deep equal";
export default async (
  actual: unknown,
  expected: unknown,
  message: string = DefaultMessage,
  operator = "eventualequal"
): Promise<string | TestError> => {
  if (await eventualequal(actual, expected)) {
    return message;
  }
  return new TestError(message, {
    actual: actual,
    expected: expected,
    operator,
  });
};
