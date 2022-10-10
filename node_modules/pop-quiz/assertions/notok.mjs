import TestError from "../testerror.mjs";
export const DefaultMessage = "should be falsy";
export default (actual, message = DefaultMessage, operator = "notok") => {
  if (!actual) {
    return message;
  }
  return new TestError(message, { actual, operator });
};
