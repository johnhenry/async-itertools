import TestError from "pop-quiz/testerror";
// https://deno.land/x/cotton@v0.6.3/src/utils/deepequal.ts
import { eventualequal } from "../src/eventualequal.mjs";

export const DefaultMessage = "should eventually be deep equal";
export default async (
  actual,
  expected,
  message = DefaultMessage,
  operator = "eventualequal"
) => {
  if (await eventualequal(actual, expected)) {
    return message;
  }
  return new TestError(message, {
    actual: actual,
    expected: expected,
    operator,
  });
};
