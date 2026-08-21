# Async-itertools

> **Archived.** This library has moved into the
> [Mallory monorepo](https://github.com/johnhenry/mallory) as
> `packages/iteration`, published to npm as
> [`mallory-iteration`](https://www.npmjs.com/package/mallory-iteration) —
> imported via `git subtree` with full history preserved (106 commits,
> including this repo's 2019-era work and the v2.0 transduce leak fix).
> [PR #17](https://github.com/johnhenry/async-itertools/pull/17) (the
> planned v2.0.0 release: transduce leak fix, TypeScript conversion,
> AbortSignal, bounded concurrency, backpressure) already landed there —
> its content is not being merged here. New issues, PRs, and releases
> should go to `mallory-iteration` instead; `async-itertools@1.0.1`
> remains on npm unchanged but won't receive further updates.
>
> The rest of this README is kept for historical reference.

This module implements a number of asynchronous iterator building blocks inspired by constructs from [Python](https://docs.python.org/3/library/itertools.html), APL, Haskell, and SML. Each has been recast in a form suitable for JavaScript.

The module standardizes a core set of fast, memory efficient tools that are useful by themselves or in combination. Together, they form an “iterator algebra” making it possible to construct specialized tools succinctly and efficiently in pure JavaScript.

### Native Iterator Helpers interop

Since this library's original release, JavaScript gained native **Iterator Helpers** (`Iterator.prototype.map/filter/take/drop/flatMap/reduce/toArray/forEach/some/every/find`, `Iterator.from`, shipped as ES2025 in Node 22+ and current Chrome/Firefox/Safari) — covering much of this library's original *synchronous* transformation story directly in the language. Where a sync function here is fully covered by a native helper, its implementation leans on `Iterator.from(iterable)` rather than a hand-rolled generator.

**Async Iterator helpers are not yet shipped** (still TC39 Stage 2 as of this writing), so the async half of this library remains hand-rolled and is where it continues to add the most value — every sync function here has an async dual for exactly this reason. See [docs/discussion/python-itertools.md](./docs/discussion/python-itertools.md) for the full design rationale and a function-by-function comparison to Python's `itertools`.

Requires **Node.js 22.12+** (or an equivalent Iterator-Helpers-capable engine).

### CommonJS / `require()`

This package ships only ESM source (`"type": "module"`, raw `.mjs` files, no build step) — but it's still directly usable from CommonJS. Node's native `require(esm)` support (stable and unflagged since **Node 22.12**, which is why that's this package's floor) lets `require()` load an ES module synchronously:

```javascript
const { countSync, someAsync } = require("async-itertools");
```

No separate CJS build or `"require"` condition in `package.json`'s `exports` is needed or provided — `require(esm)` resolves through the same `.mjs` files everything else uses. This is verified in CI (`scripts/require-esm-smoke-test.cjs`), not just documented.

## Installation

```bash
npm install async-itertools
```

## Production

Generally, you'll use this library to transform existing iterators; but we provide a number of differerent methods to create iterators as well.

### `emptySync` & `emptyAsync`

Create empty iterators

```javascript
import { emptySync, emptyAsync } from "async-itertools";
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
} from "async-itertools";
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
import { syncFrom, asyncFrom } from "async-itertools";
for (const a of syncFrom(1, 2, 3)) {
  console.log(a);
} // logs 1, 2, 3
for await (const a of asyncFrom(4, 5, 6)) {
  console.log(a);
} // logs 4, 5, 6
```

### `zipSync` & `zipAsync`

Zip several iterators together, stopping at the shortest one. `zipAsync` pulls
the next value from every input in parallel each round, and accepts a mix of
sync and async iterables.

```javascript
import { zipSync, zipAsync } from "async-itertools";
for (const pair of zipSync([1, 2, 3], ["a", "b", "c"])) {
  console.log(pair);
} // logs [1,'a'], [2,'b'], [3,'c']
for await (const pair of zipAsync([1, 2, 3], ["a", "b"])) {
  console.log(pair);
} // logs [1,'a'], [2,'b'] -- stops at the shorter input
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
import { transduceSync } from "async-itertools";
// import { transduceSync } from "async-itertools/transduce";
for (const item of transduceSync(/*list of transducers*/)(/*some iterator*/)) {
  // do something with transduced item
}
```

```javascript
import { transduceAsync } from "async-itertools";
// import { transduceAsync } from "async-itertools/transduce";
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
// import { transducers } from "async-itertools";
// const { map } = transducers;
import { map } from "async-itertools/transducers";
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
import { filter } from "async-itertools/transducers";
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
import { accumulate } from "async-itertools/transducers";
const sum = accumulate((a, b) => a + b, 0);
for (const x of transduceSync(sum)([1, 2, 3, 4])) {
  console.log(x);
}
// logs: 1, 3, 6, 10
```

### `group`

Place items into groups of size N. A trailing, under-sized group is flushed
once the source is exhausted (via the transducer completion protocol — see
`transduceSync`/`transduceAsync`).

```javascript
import { group } from "async-itertools/transducers";
const triplet = group(3);
for (const x of transduceSync(triplet)([1, 2, 3, 4, 5, 6, 7])) {
  console.log(x);
}
// logs: [1, 2, 3], [4, 5, 6], [7]
```

### `take`

Take only the first N items and drop the rest (see 'drop').

```javascript
import { take } from "async-itertools/transducers";
const take5 = take(5);
for (const x of transduceSync(take5)([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  console.log(x);
}
// logs: 1, 2, 3, 4, 5
```

### `drop`

Drop the first N items and take the rest (see 'take'). Previously named
`reject` — renamed since `reject` now names the predicate-based complement
of `filter`, below.

```javascript
import { drop } from "async-itertools/transducers";
const dropDozen = drop(12);
for (const x of transduceSync(dropDozen)([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
])) {
  console.log(x);
}
// logs 13, 14
```

### `reject`

Reject items matching a predicate and keep the rest — the complement of
`filter` (see 'filter'). Mirrors Python's `itertools.filterfalse`.

```javascript
import { reject } from "async-itertools/transducers";
const rejectEven = reject((x) => x % 2 === 0);
for (const x of transduceSync(rejectEven)([1, 2, 3, 4, 5])) {
  console.log(x);
}
// logs 1, 3, 5
```

### `dedupe`

Skip consecutive duplicate items (by key). Mirrors the `unique_justseen`
recipe documented in Python's itertools docs — the transducer-pipeline,
adjacent-only counterpart to `uniqueSync`/`uniqueAsync` (which dedupe
globally, across the whole stream, not just neighboring items).

```javascript
import { dedupe } from "async-itertools/transducers";
for (const x of transduceSync(dedupe())([1, 1, 2, 2, 1, 1, 3])) {
  console.log(x);
}
// logs 1, 2, 1, 3 -- note the non-adjacent 1s both survive
```

### `interpose`

Insert a separator between consecutive emitted items — not before the
first item, and not after the last.

```javascript
import { interpose } from "async-itertools/transducers";
for (const x of transduceSync(interpose(","))([1, 2, 3])) {
  console.log(x);
}
// logs 1, ',', 2, ',', 3
```

### `partitionBy`

Group consecutive items sharing a key into arrays, emitting each completed
group as soon as the key changes. The transducer-pipeline counterpart to
`groupBySync`/`groupByAsync`; distinct from `group`, above, which chunks by
a fixed size rather than by a shared key. Like `group`, a trailing partial
run is flushed once the source completes.

```javascript
import { partitionBy } from "async-itertools/transducers";
for (const x of transduceSync(partitionBy())([1, 1, 2, 1, 1])) {
  console.log(x);
}
// logs [1, 1], [2], [1, 1]
```

### `tap`

Call `fn(item)` for its side effect and pass the item through unchanged.
RxJS-style, for debugging or instrumenting a pipeline without altering its
values.

```javascript
import { tap } from "async-itertools/transducers";
const logged = tap((x) => console.log("saw:", x));
for (const x of transduceSync(logged)([1, 2, 3])) {
  // "saw: 1", "saw: 2", "saw: 3" logged as a side effect;
  // x is still 1, 2, 3
}
```

Multiple different types of transducers can be applied.

```javascript
import { map, filter, take } from "async-itertools/transducers";
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

Custom stateful transducers can flush buffered state once the source
iterator completes by attaching a `.complete(init)` method to the step
function they return (see `group`, above, for a worked example) — see
`reduceSync`/`reduceAsync` in `src/iterator-tools.mjs` for the protocol.

## Python itertools parity (`async-itertools/itertools`)

Flat, non-curried building blocks mirroring functions from Python's
[`itertools`](https://docs.python.org/3/library/itertools.html) module —
unlike the transducer factories above, these take the iterable(s) directly
and return a generator, matching Python's argument order. Each has a sync
and async form. See
[docs/discussion/python-itertools.md](./docs/discussion/python-itertools.md)
for the full comparison table and documented design divergences.

```javascript
import {
  takeWhileSync,
  dropWhileSync,
  compressSync,
  pairwiseSync,
  windowedSync,
  groupBySync,
  chainSync,
  flattenSync,
  cycleSync,
  repeatSync,
  uniqueSync,
  enumerateSync,
  starmapSync,
  zipLongestSync,
  isliceSync,
  // ...and their `*Async` duals: takeWhileAsync, dropWhileAsync, etc.
} from "async-itertools";
// or: import { ... } from "async-itertools/itertools";

takeWhileSync((x) => x < 3, [1, 2, 3, 4, 1]); // yields 1, 2
dropWhileSync((x) => x < 3, [1, 2, 3, 4, 1]); // yields 3, 4, 1
compressSync(["a", "b", "c", "d"], [1, 0, 1, 0]); // yields 'a', 'c'
[...pairwiseSync([1, 2, 3, 4])]; // [[1,2],[2,3],[3,4]]
[...windowedSync([1, 2, 3, 4, 5], 3)]; // [[1,2,3],[2,3,4],[3,4,5]]
[...groupBySync([1, 1, 2, 1])]; // [[1,[1,1]],[2,[2]],[1,[1]]] -- consecutive runs only
[...chainSync([1, 2], [3, 4])]; // [1,2,3,4]
[...flattenSync([[1, 2], [3, 4]])]; // [1,2,3,4]
[...isliceSync(cycleSync([1, 2, 3]), 7)]; // [1,2,3,1,2,3,1]
[...repeatSync("x", 3)]; // ['x','x','x']
[...uniqueSync([1, 1, 2, 3, 2, 1])]; // [1,2,3]
[...enumerateSync(["a", "b"])]; // [[0,'a'],[1,'b']]
[...starmapSync((a, b) => a + b, [[1, 2], [3, 4]])]; // [3,7]
[...zipLongestSync(null, [1, 2, 3], ["a", "b"])]; // [[1,'a'],[2,'b'],[3,null]]
[...isliceSync([1, 2, 3, 4, 5, 6, 7, 8], 1, 8, 2)]; // [2,4,6,8]
```

## Combinatorics (`async-itertools/combinatorics`)

`product`, `permutations`, `combinations`, and `combinationsWithReplacement`
— direct ports of the iterative algorithms documented in CPython's own
`itertools` docs. Each has an `Async` variant that accepts an async iterable
*source*: it fully materializes the source first (these are inherently
"collect-then-compute" algorithms, in Python too), then generates
combinatorially, so it's not a streaming operation.

```javascript
import {
  product,
  permutations,
  combinations,
  combinationsWithReplacement,
} from "async-itertools";
// or: import { ... } from "async-itertools/combinatorics";

[...product([1, 2], [3, 4])]; // [[1,3],[1,4],[2,3],[2,4]]
[...permutations([1, 2, 3], 2)]; // [[1,2],[1,3],[2,1],[2,3],[3,1],[3,2]]
[...combinations([1, 2, 3], 2)]; // [[1,2],[1,3],[2,3]]
[...combinationsWithReplacement([1, 2], 2)]; // [[1,1],[1,2],[2,2]]

// Async variants accept async iterable sources:
for await (const combo of combinationsAsync(fetchItemsAsync(), 2)) {
  console.log(combo);
}
```

## Terminal consumers (`async-itertools/consumers`)

Resolve an iterable to a single value (or a `Promise` of one), rather than
another iterable. Two families:

- **Iterator-Helper parity** — `someSync`/`everySync`/`findSync`/
  `forEachSync`/`foldSync` mirror native ES2025 `Iterator.prototype.some/
  every/find/forEach/reduce` (which sync code already gets for free via
  `Iterator.from(iterable)`); the `*Async` duals hand-roll the same behavior
  since `AsyncIterator` helpers aren't shipped yet. `foldSync`/`foldAsync`
  are named `fold`, not `reduce`, to avoid colliding with this library's own
  `reduceSync`/`reduceAsync` (an internal streaming primitive, not a
  terminal reduce-to-one-value). `someSync`/`someAsync`/`everySync`/
  `everyAsync`/`findSync`/`findAsync` all short-circuit — they won't
  exhaust an infinite source once the answer is known.
- **Summary/aggregate consumers** — `firstSync`/`lastSync`/`nthSync`/
  `quantifySync`/`minSync`/`maxSync`, borrowed from Python builtins/
  itertools-recipes and other itertools-adjacent libraries' "summary"
  namespaces. `quantifySync`/`quantifyAsync` (count items matching a
  predicate) are named after the `quantify` recipe documented in Python's
  own itertools docs — deliberately *not* `count`, which already means
  something else here (`countSync` mirrors `itertools.count`, an integer
  sequence generator; see [`countSync` & `countBigSync`](#countsync--countbigsync-countasync--countbigasync),
  above). `findSync`/`firstSync`/`lastSync`/`nthSync`/`minSync`/`maxSync`
  return `undefined` (or a caller-supplied `defaultValue`) on an
  empty/no-match input rather than throwing — this deliberately diverges
  from Python's own `min()`/`max()`, which throw without a `default`.

```javascript
import {
  someSync, everySync, findSync, forEachSync, foldSync,
  firstSync, lastSync, nthSync, quantifySync, minSync, maxSync,
  // ...and their `*Async` duals
} from "async-itertools";
// or: import { ... } from "async-itertools/consumers";

someSync((x) => x > 2, [1, 2, 3]); // true
everySync((x) => x > 0, [1, 2, 3]); // true
findSync((x) => x > 1, [1, 2, 3]); // 2
foldSync((a, b) => a + b, 0, [1, 2, 3, 4]); // 10
firstSync([1, 2, 3]); // 1
lastSync([1, 2, 3]); // 3
nthSync([10, 20, 30, 40], 2); // 30
quantifySync([1, 2, 3, 4], (x) => x % 2 === 0); // 2
minSync(["abc", "a", "ab"], (s) => s.length); // 'a'
maxSync(["abc", "a", "ab"], (s) => s.length); // 'abc'
```

Need every item collected into an array instead? That's `exhaustSync`/
`exhaustAsync` (below) — no separate `toArraySync`/`toArrayAsync` alias is
provided.

## Utilities

This library provides a number of iterator related utilities.

### `isIterator` & `isAsyncIterator` & `exhaustable`

Test of object is an iterator or asyncIterator, or either.

```javascript
import { isIterator, isAsyncIterator, exhaustable } from "async-itertools";
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

Exhaust all items from iterator — this library's "collect to an array"
(`toArray`) operation; see [Terminal consumers](#terminal-consumers-async-itertoolsconsumers)
for other ways to resolve an iterable to a single value.
Warning: Initial object may have items removed

```javascript
import { exhaust, exhaustSync, exhaustAsync } from "async-itertools";
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
import { teeSync, teeAsync } from "async-itertools";
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
import { AsyncChannel } from "async-itertools";
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
import { withWebSocket } from "async-itertools/channel-decorators";
const socket = new WebSocket(/*ws url*/);
withWebSocket(c, socket);
```

```javascript
// file://use-event-emitter.mjs
import { c } from "./declare.mjs";
import { withEmitter } from "async-itertools/channel-decorators";
const source = new EventSource(/*sse url*/);
withEmitter(c, source);
```
