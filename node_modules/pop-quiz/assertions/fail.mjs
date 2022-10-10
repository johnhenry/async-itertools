import TestError from "../testerror.mjs";
export const DefaultMessage = "should always fail";
export default (message = DefaultMessage) => {
  return new TestError(message, {
    actual: undefined,
    expected: undefined,
    message,
    operator: "fail",
  });
};
