# Async-itertools

This module implements a number of asynchronous iterator building blocks inspired by constructs from [Python](https://docs.python.org/3/library/itertools.html), APL, Haskell, and SML. Each has been recast in a form suitable for JavaScript.

The module standardizes a core set of fast, memory efficient tools that are useful by themselves or in combination. Together, they form an “iterator algebra” making it possible to construct specialized tools succinctly and efficiently in pure JavaScript.

## Installation

```bash
npm install async-itertools
```

## Production

Generally, you'll use this library to transform existing iterators; but we provide a number of differerent methods to create iterators as well.

### `emptySync` & `emptyAsync`

Create empty iterators

```javascript
import { emptySync, emptyAsync } from "async-iterator";
for (const a of emptySync()) {
  // dream the impossible
}
for (const a of emptyAsync()) {
  // do the impossible!
}
```

### `countSync` & `countBigSync`; `countAsync` & `countBigAsync`

Create a sequence of integers

```javascript
import {
  countSync,
  countBigSync,
  countAsync,
  countBigAsync,
} from "async-iterator";
for (const a of countSync(0, 9)) {
  console.log(a);
} // logs 1, 2, 3, 4, 5, 6, 7, 8, 9
for (const a of countBigSync(9n, 0n)) {
  console.log(a);
} // logs 9n, 8n, 7n, 6n, 5n, 4n, 3n, 2n, 1n, 0n
for await (const a of countAsync(0, 9)) {
  console.log(a);
} // logs 1, 2, 3, 4, 5, 6, 7, 8, 9
for await (const a of countBigAsync(9n, 0n)) {
  console.log(a);
} // logs 9n, 8n, 7n, 6n, 5n, 4n, 3n, 2n, 1n, 0n
```

### `syncFrom` & `asyncFrom`

Create iterators from given items

```javascript
import { syncFrom, asyncFrom } from "async-iterator";
for (const a of syncFrom(1, 2, 3)) {
  console.log(a);
} // logs 1, 2, 3
for await (const a of asyncFrom(4, 5, 6)) {
  console.log(a);
} // logs 4, 5, 6
```

## Transformation: transducers

This library employs transducers,
(see [this](https://clojure.org/reference/transducers)),
to transform iterators.

This library provides two methods
-- `transduceSync` and `transduceAsync` --
to apply transducers to synchronous
and asynchronous iterators.

```javascript
import { transduceSync } from "async-iterator";
// import { transduceSync } from "async-iterator/transduce";
for (const item of transduceSync(/*list of transducers*/)(/*some iterator*/)) {
  // do something with transduced item
}
```

```javascript
import { transduceAsync } from "async-iterator";
// import { transduceAsync } from "async-iterator/transduce";
for await (const item of transduceAsync(/*list of transducers*/)(/*some asynchronous iterator*/)) {
  // do something with transduced item
}
```

In addition, the library provides
a number of built-in transducers
that can be applied.

### `map`

Similiar to [Array.prototype.map](),
maps items with a given transformation function.

```javascript
// import { transducers } from "async-iterator";
// const { map } = transducers;
import { map } from "async-iterator/transducers";
const addOne = map((x) => x + 1);
const abs = map(Math.abs);
for (const x of transduceSync(addOne, abs)([-3, -2, -1, 0, 1, 2, 3])) {
  console.log(x);
}
// logs: 2, 1, 0, 1, 2, 3, 4
```

### `filter`

Similiar to [Array.prototype.filter](),
filters items that do not match a given predicate

```javascript
import { filter } from "async-iterator/transducers";
const removeStrings = map((x) => typeof x !== "string");
const keepPositive = map((x) => x > 0);
for (const x of transduceSync(
  removeStrings,
  keepPositive
)(["alice", -3, -2, "bob", -1, 0, 1, "claire", 2, 3])) {
  console.log(x);
}
// logs: 0, 1, 2, 3
```

### `accumulate`

Apply function successively to items in iterator.
Similar to `Array.prototype.reduce`.

```javascript
import { accumulate } from "async-iterator/transducers";
const sum = accumulate((a, b) => a + b, 0);
for (const x of transduceSync(sum)([1, 2, 3, 4])) {
  console.log(x);
}
// logs: 1, 3, 6, 10
```

### `group`

Place items into groups of size N.

```javascript
import { group } from "async-iterator/transducers";
const triplet = group(3);
for (const x of transduceSync(triplet)([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  console.log(x);
}
// logs: [1, 2, 3], [4, 5, 6], [7, 8, 9]
```

### `take`

Take only the first N items and drop the rest (see 'reject').

```javascript
import { take } from "async-iterator/transducers";
const take5 = take(5);
for (const x of transduceSync(take5)([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  console.log(x);
}
// logs: 1, 2, 3, 4, 5
```

### `reject`

Reject first N items and take the rest (see 'take').

```javascript
import { reject } from "async-iterator/transducers";
const rejectDozen = reject(12);
for (const x of transduceSync(take5)([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
])) {
  console.log(x);
}
// logs 13, 14
```

Multiple different types of transducers can be applied.

```javascript
import { map, filter, take } from "async-iterator/transducers";
const transformation = transduceSync(
  map((x) => x + 2),
  filter((x) => x % 2),
  take(4)
);
for (const x of transformation([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
])) {
  console.log(x);
}
// logs 3, 5, 7, 9
```

## Utiilities

This library provides a number of iterator related utilities.

### `isIterator` & `isAsyncIterator` & `exahusable`

Test of object is an iterator or asyncIterator, or either.

```javascript
import { isIterator, isAsyncIterator, exhaustable } from "async-iterator";
const iterator = (function* () {})();
const asyncIterator = (async function* () {})();
const block = {};
console.log(isIterator(iterator)); // true
console.log(isAsyncIterator(iterator)); // false
console.log(exhaustable(iterator)); // true
console.log(isIterator(asyncIterator)); // false
console.log(isAsyncIterator(asyncIterator)); // true
console.log(exhaustable(asyncIterator)); // true
console.log(isIterator(block)); // false
console.log(isAsyncIterator(block)); // false
console.log(exhaustable(block)); // false
```

### `exhaust` & `exhaustSync` & `exhaustAsync`

Exhaust all items from iterator.
Warning: Initial object may have items removed

```javascript
import { exhaust, exhaustSync, exhaustAsync } from "async-iterator";
const iterator = [1, 2, 3];
const aIterator = (async function* () {
  yield 4;
  yield 5;
  yield 6;
})();
const oneTwoThree = exhaust(iterator); //[1,2,3]
const fourFiveSix = await exhaust(iterator); //[4,5,6]
const oneTwoThreeB = exhaustSync(iterator); //[1,2,3]
const fourFiveSixB = await exhaustAsync(iterator); //[]
```

### `teeSync` & `teeAsync`

Tee iterator onto n other iterators
Warning: Initial object may be emptied

```javascript
import { teeSync, teeAsync } from "async-iterator";
const iterator = (async function* () {
  yield 1;
  yield 2;
  yield 3;
})();

const [i0, i1, i2] = teeAsync(3)(iterator);

for (const x of i0) {
  console.log(x);
} // logs 1, 2, 3

for (const x of transduce(map((x) => x - 1))(i1)) {
  console.log(x);
} // logs 0, 1, 2

for (const x of transduce(filter((x) => x > 2))(i2)) {
  console.log(x);
} // logs  3
```

### `AsyncChannel`

AsyncChannel is an experimental primative object.

```javascript
// file://declare.mjs
import { AsyncChannel } from "async-iterator";
export const c = new AsyncChannel();
setTimeout(async () => {
  for await (const i of c) {
    console.log(i);
  }
});
```

Put items directly on an async channel.

```javascript
// file://use.mjs
import { c } from "./declare.mjs";
c.put("hello"); //logs "hello"
c.put("world"); //logs "world"
```

Automatically place items onto channels via decorators

```javascript
// file://use-websocket.mjs
import { c } from "./declare.mjs";
import { withWebSocket } from "async-iterator/channel-decorators";
const socket = new WebSocket(/*ws url*/);
withWebSocket(c, socket);
```

```javascript
// file://use-event-emitter.mjs
import { c } from "./declare.mjs";
import { withEmitter } from "async-iterator/channel-decorators";
const source = new EventSource(/*sse url*/);
withEmitter(c, source);
```
