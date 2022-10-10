import TestError from "../testerror.mjs";
export const DefaultMessage = "should not throw error";
export default async (
  actual,
  message = DefaultMessage,
  operator = "doesnotthrow"
) => {
  try {
    await actual();
    return message;
  } catch {
    return new TestError(message, { actual, operator });
  }
};
