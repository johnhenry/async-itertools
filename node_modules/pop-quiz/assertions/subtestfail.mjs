import TestError from "../testerror.mjs";
import { run } from "../TAPRunner.mjs";

export const DefaultMessage = "should fail all subtests";
export default async (
  actual,
  message = DefaultMessage,
  operator = "subtestfail"
) => {
  for await (const result of run(actual)) {
    if (!(result instanceof TestError)) {
      return new TestError(message, { actual, operator });
    }
  }
  return message;
};
