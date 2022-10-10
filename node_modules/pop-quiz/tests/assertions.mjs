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

await tester("Test assertions", function* () {
  yield pass("pass should always pass");
  yield ok(true, "ok should pass if given argument is truthy");
  yield notok(false, "notok should pass if given argument is falsy");
  yield equal(
    true,
    true,
    "equal should pass if given arguments are strictly equal (or not both NaN)"
  );
  yield notequal(
    true,
    false,
    "notequal should pass if given arguments are strictly notequal (or not both NaN)"
  );
  yield deepequal(
    { a: true, b: false },
    { b: false, a: true },
    "deepequal should pass if given arguments are deeply equal"
  );
  yield subtestpass(function* () {
    yield pass();
  }, "subtestpass should pass if subtest passes");
  yield subtestfail(function* () {
    yield fail();
  }, "subtestfail should pass if subtest fails");
  yield throws(() => {
    throw new Error("");
  }, "throws should pass if function throws an error when called");
  yield doesnotthrow(() => {},
  "doesnotthrow should pass if function does not throw an error when called");
});
