# Pop-Quiz (Formery "Tester")

`/js/pop-quiz@0.0.0/index.mjs`

A context-independent testing framework inspired by [tape](https://github.com/substack/tape).

## Comparison to Tape

Like Tape, pop-quiz

- can be run directly using [node](https://nodejs.org) without any binaries or transformations.
- produces output using the standard [Test Anything Protocol](https://testanything.org/).

Unlike Tape, pop-quiz

- can be run directly in the browser or using [node](https://nodejs.org), [deno](https://deno.land), and browser environments
  without any binaries or transformations.
- requires no dependencies
- uses external assertions and makes it easy to write your own.

## context-agnostic

Tests run in same context as your application. No special executables needed.

## TAP Output

Pop-Quiz outputs to the console using a partial implementation of the [Test Anything Protocol](https://testanything.org/tap-specification.html).

## Installation

Install via npm with `npm install pop-quiz`
or
import directly from website:

```javascript
import quiz from "https://johnhenry.github.io/lib/js/pop-quiz/0.0.0/index.mjs";
```

## API

Pop-Quiz's API consist of two manin components:

- The "quiz" function acts on a group of assertions.
- The assertions themselves, which return errors if a given condition is not satisfied.

### Quiz

The quiz function is the default export.

It takes as its only argument a [possibly asynchronous] generator. We call this a "test".

Results of assertions are yielded from within the body of a test.

```javascript
import quiz from "pop-quiz";
quiz(function* () {
  yield /*some assertion result*/;
  yield /*some other assertion result*/;
});
```

### Assertions

The named exports are assertions.

Call them within a test and yield their results.

```javascript
import quiz, { ok, notok } from "pop-quiz";

quiz(function* () {
  yield ok(true);
  yield notok(false);
});
```

#### Included Assertions

Besides ok and notok, a number of assertions are included:

- ok -- test passes if and only if the given argument to a test is TRUTHY.
- notok -- test passes if and only if the given argument to a test is FALSH.
- equal -- test passes if and only if the two given arguments are THE SAME object.
- notequal -- test passes if and only if the two given arguments are NOT THE SAME object.
- deepequal -- test passes if and only if two objects are deeply equal.
- pass -- test ALWAYS PASSES
- fail -- test ALWAYS FAILS
- subtestpass -- test passes if and only if the given argument is a test in which ALL THE ASSERTIONS PASS.
- subtestfail -- test passes if and only if the given argument is a test in which AT LEAST ONE ASSERTION FAILS.
- throws -- test passes if and only if the given function THROWS AN ERROR when called
- doesnotthrow -- test passes if and only if the given function DOES NOT THROW AN ERROR when called

### plan

When using the run function, the first argument passed to given generator is a function.
We'll call it "plan", but you can name it anyting you like ("expect", "assertions", etc.)
When _plan_ is called with an integer, it dictates the number of expected assertions in a given test function.

```javascript
import quiz, { ok } from "pop-quiz";

quiz(function* (plan) {
  plan(1);
  yield ok(true);
});
```

## Creating Assertions

When creating assertions, use the examples in _./assertions_ for inspiration.
Here are a few things to keep in mind:

- Assertions are functions that test for a desired conditon.
- If the given conditions meet the desired conditions,
  - an accepted message is returned.
  - Otherwise, an instance of TestError is returned.

```javascript
import TestError from "./testerror.mjs";

const assertion = (/*given conditions*/)=>{
  if(/*conditions are met*/){
    return /*some message*/;
  }
  return new TestError(/*some message*/);
}
```

### Conventions

This library follows a specific convetion for its assertions.
It's recommended that you follow these conventions when creating your own assertions,
but feel free to come up with your own.

- The last item is an _operator string_, which is used for the TAP protocol and can be overridden.
- The next-to-last item is a _default expected message_ that can also be overridden.
- The preceeding arguments are given conditions to be tested.
- The returned TestError is constructed using the default expected message
  along with an object detailing the difference between what's expected and what's not.

```javascript
import TestError from "./testerror.mjs";

const assertion = (/*given conditions*/, message, operatorString)=>{
  if(/*conditions are met*/){
    return message;
  }
  return new TestError(message, /*some object*/));
}
```

### TestError API

The test error is constructed with two items:

- An expected messages
- An object who's key-value pairs are displayed as part of TAP output

## TAPRunner, print, run

The file "/TAPRunner.mjs" export methods "print" and "run".
"print" functions similarly to the default export of "index.mjs" --
both of which rely on "run" to execute underlying code.

When called with as single argument (a test),
"run" yields only the results of the test (string or Error) without additional processing.
