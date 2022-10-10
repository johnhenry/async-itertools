const TAP_VERSION = 13;
import TestError from "./testerror.mjs";

export const TAPResultRange = function (num) {
  return `1..${num}`;
};

export const TAPResultTitle = function (title) {
  return `# ${title}`;
};
export const TAPResultFail = function (output, index) {
  const { message } = output;
  const result = [];
  result.push(`not ok ${index} - ${message}`);
  result.push(`  ---`);
  for (const [key, value] of output) {
    result.push(`    ${key}: ${value}`);
  }
  result.push(`  ...`);
  return result.join("\n");
};

export const TAPResultPass = function (output, index) {
  return `ok ${index} - ${output}`;
};

export const TAPResultCounts = function (tests, pass, fail) {
  const result = [];
  result.push(`# tests ${tests}`);
  result.push(`# pass  ${pass}`);
  result.push(`# fail  ${fail}`);
  return result.join("\n");
};

const empty = () => {};
const identity = (x) => x;
export const run = async function* (
  test,
  title = "",
  resultPass = identity,
  resultFail = identity,
  resultCounts = empty,
  resultRange = empty
) {
  if (title) {
    yield title;
  }
  let index = 1;
  let planCalled = false;
  let indexPrinted = false;
  let num;
  let started;
  const plan = (number) => {
    if (planCalled) {
      throw new Error("do not call plan more than once");
    }
    planCalled = true;
    num = number;
  };
  let tests = 0;
  let pass = 0;
  let fail = 0;
  for await (const output of test(plan)) {
    if (planCalled & !started) {
      let range;
      if (num === undefined) {
        range = resultRange(index - 1);
      } else {
        range = resultRange(num);
      }
      if (range) {
        yield range;
      }
      indexPrinted = true;
    }
    if (output instanceof TestError) {
      yield resultFail(output, index);
      fail++;
    } else {
      yield resultPass(output, index);
      pass++;
    }
    index++;
    tests++;
    started = true;
  }
  if (!indexPrinted) {
    const range = resultRange(index - 1);
    if (range) {
      yield range;
    }
  }
  const counts = resultCounts(tests, pass, fail);
  if (counts) {
    yield counts;
  }
};

export const print = async function (
  test,
  title,
  log = console.log,
  logError = console.error,
  logVersion = true
) {
  if (logVersion) {
    log(`TAP version ${TAP_VERSION}`);
  }
  for await (const output of run(
    test,
    title,
    TAPResultPass,
    TAPResultFail,
    TAPResultCounts,
    TAPResultRange
  )) {
    if (output instanceof TestError) {
      logError(output);
    } else {
      log(output);
    }
  }
};
