import TestError from "../testerror.mjs";
export const DefaultMessage = "should be strictly equal";
export default (
  actual,
  expected,
  message = DefaultMessage,
  operator = "equal"
) => {
  if (actual === expected) {
    return message;
  }
  return new TestError(message, { actual, expected, message, operator });
};
