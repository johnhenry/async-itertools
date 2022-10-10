import tester, {
  ok,
  notok,
  equal,
  notequal,
  deepequal,
  pass,
  fail,
  subtestpass,
  subtestfail,
  throws,
  doesnotthrow,
} from "../index.mjs";
import { run } from "../TAPRunner.mjs";
import { DefaultMessage as DefaultMessageOK } from "../assertions/ok.mjs";
import { DefaultMessage as DefaultMessageNotOK } from "../assertions/notok.mjs";
import { DefaultMessage as DefaultMessageEqual } from "../assertions/equal.mjs";
import { DefaultMessage as DefaultMessageNotEqual } from "../assertions/notequal.mjs";
import { DefaultMessage as DefaultMessageDeepEqual } from "../assertions/deepequal.mjs";
import { DefaultMessage as DefaultMessagePass } from "../assertions/pass.mjs";
import { DefaultMessage as DefaultMessageSubtestPass } from "../assertions/subtestpass.mjs";
import { DefaultMessage as DefaultMessageSubtestFail } from "../assertions/subtestfail.mjs";
import { DefaultMessage as DefaultMessageSubtestThrows } from "../assertions/throws.mjs";
import { DefaultMessage as DefaultMessageSubtestDoesnotthrow } from "../assertions/doesnotthrow.mjs";

// import { DefaultMessage as DefaultMessageDeelFail } from '../assertions/fail.mjs';

import TestError from "../testerror.mjs";

await tester("Test run without print", async function* () {
  // simulate passing tests
  const tests = [
    pass,
    ok,
    notok,
    equal,
    notequal,
    deepequal,
    subtestpass,
    subtestfail,
    throws,
    doesnotthrow,
  ];
  const args = [
    [],
    [1],
    [0],
    [1, 1],
    [1, 0],
    [
      { a: 1, b: 0 },
      { b: 0, a: 1 },
    ],
    [
      function* () {
        yield pass();
      },
    ],
    [
      function* () {
        yield fail();
      },
    ],
    [
      () => {
        throw new Error("");
      },
    ],
    [() => {}],
  ];
  const expected = [
    DefaultMessageOK,
    DefaultMessageNotOK,
    DefaultMessageEqual,
    DefaultMessageNotEqual,
    DefaultMessageDeepEqual,
    DefaultMessagePass,
    DefaultMessageSubtestPass,
    DefaultMessageSubtestFail,
    DefaultMessageSubtestThrows,
    DefaultMessageSubtestDoesnotthrow,
  ];
  let index = 0;
  for await (const output of run(async function* () {
    for (let i = 0; i < tests.length; i++) {
      yield tests[i](...args[i], expected[i]);
    }
  })) {
    yield equal(
      output,
      expected[index],
      `should produce expected result: ${expected[index]}`
    );
    index++;
  }

  // simulate failing tests
  const badtests = [
    fail,
    ok,
    notok,
    equal,
    notequal,
    deepequal,
    subtestpass,
    subtestfail,
    throws,
    doesnotthrow,
  ];

  const badargs = [
    [],
    [0],
    [1],
    [1, 0],
    [1, 1],
    [{ a: 1, b: 0 }, { a: 1 }],
    [
      function* () {
        yield fail();
      },
    ],
    [
      function* () {
        yield pass();
      },
    ],
    [() => {}],
    [
      () => {
        throw new Error("");
      },
    ],
  ];
  for await (const output of run(async function* () {
    for (let i = 0; i < tests.length; i++) {
      yield badtests[i](...badargs[i]);
    }
  })) {
    yield ok(
      output instanceof TestError,
      `should produce an error: ${output.message}`
    );
  }
});
