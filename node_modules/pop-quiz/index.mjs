import { print } from "./TAPRunner.mjs";
export default (title, test, primaryTest = true) =>
  test
    ? print(test, title, undefined, undefined, primaryTest)
    : print(title, undefined, undefined, undefined, primaryTest);
export * from "./assertions/index.mjs";
