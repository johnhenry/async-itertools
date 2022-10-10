import TestError from "../testerror.mjs";
export const DefaultMessage = "should be truthy";
export default (actual, message = DefaultMessage, operator = "ok") => {
  if (actual) {
    return message;
  }
  return new TestError(message, { actual, operator });
};
