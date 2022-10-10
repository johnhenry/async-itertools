import TestError from "../testerror.mjs";
export const DefaultMessage = "should throw error";
export default async (
  actual,
  message = DefaultMessage,
  operator = "throws"
) => {
  try {
    await actual();
  } catch {
    return message;
  }
  return new TestError(message, { actual, operator });
};
