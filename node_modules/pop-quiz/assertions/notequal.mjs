import TestError from "../testerror.mjs";
export const DefaultMessage = "should be strictly not equal";
export default (
  actual,
  unexpected,
  message = DefaultMessage,
  operator = "notequal"
) => {
  if (actual !== unexpected) {
    return message;
  }
  return new TestError(message, { actual, unexpected, message, operator });
};
