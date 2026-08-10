[↑](../../readme.md)

# Comparison to Python's Itertools Library

## Design philosophy

Python's [`itertools`](https://docs.python.org/3/library/itertools.html) is a
single module of synchronous iterator building blocks — Python has no native
async iterator protocol equivalent, so there's no "async itertools" to
compare against on the Python side. That split is this library's actual
point of divergence from Python: **every function here comes in a sync and
an async form**, and the async half is the part with no real Python
counterpart at all.

That split also lines up with where the JavaScript language itself has
moved since this library's original 2019 release. ES2025 shipped native
**Iterator Helpers** (`Iterator.prototype.map/filter/take/drop/flatMap/
reduce/toArray/forEach/some/every/find`, `Iterator.from`) — largely covering
what a hand-rolled *synchronous* itertools port would otherwise need to
provide. **Async Iterator helpers are still TC39 Stage 2** (unshipped), so
there's no native equivalent for the async side yet. Concretely:

- Where a sync function below is fully expressible via native Iterator
  Helpers, it's implemented as a thin wrapper around `Iterator.from(iterable)`
  (e.g. `enumerateSync`, `starmapSync`) rather than a hand-rolled generator.
- `takeWhile`/`dropWhile` have **no** native equivalent (`Iterator.prototype`
  ships `take`/`drop`, numeric only) so both sync and async forms are
  hand-rolled.
- Every async function is hand-rolled, since there's nothing native to lean
  on yet.

This makes the library's real ongoing value proposition the **async** half —
the sync half increasingly exists for API symmetry and Python-familiarity
rather than because JavaScript needs it anymore.

## Comparison table

| Python (`itertools`) | Sync | Async | Notes |
|---|---|---|---|
| `count` | `countSync`, `countBigSync` | `countAsync`, `countBigAsync` | requires an explicit `min`/`max`/`step`; not infinite-by-default the way Python's `count()` is unless `max` is omitted |
| `chain` | `chainSync` | `chainAsync` | alias of `concatSync`/`concatAsync`; variadic form |
| `chain.from_iterable` | `flattenSync` | `flattenAsync` | single iterable-of-iterables argument; one level only, not recursive |
| `zip` (builtin, stops at shortest) | `zipSync` | `zipAsync` | `zipAsync` pulls from every input in parallel each round, not sequentially |
| `zip_longest` | `zipLongestSync` | `zipLongestAsync` | fills exhausted inputs with a given `fillValue` (first argument), vs. Python's `fillvalue=` keyword |
| `islice` | `isliceSync` | `isliceAsync` | same overload shape: `(iterable, stop)` or `(iterable, start, stop, step)` |
| `takewhile` / `dropwhile` | `takeWhileSync` / `dropWhileSync` | `takeWhileAsync` / `dropWhileAsync` | direct ports; predicate-based complements to this library's numeric `take`/`drop` transducers |
| `compress` | `compressSync` | `compressAsync` | direct port — filters by a parallel boolean iterable rather than a predicate function |
| `filterfalse` | `reject` (transducer) | — (use `transduceAsync`) | the predicate-based complement of the `filter` transducer |
| `groupby` | `groupBySync` | `groupByAsync` | **diverges** — see below |
| `pairwise` (3.10+) | `pairwiseSync` | `pairwiseAsync` | — |
| `batched` (3.12+) | `group` (transducer) | `group` (via `transduceAsync`) | fixed-size chunking; pre-existing in this library under a different name, and distinct from `groupBySync`/`groupByAsync` below |
| `product` | `product` | `productAsync` | **diverges** — see below |
| `permutations` | `permutations` | `permutationsAsync` | same, `r` argument optional (defaults to full length) |
| `combinations` | `combinations` | `combinationsAsync` | same |
| `combinations_with_replacement` | `combinationsWithReplacement` | `combinationsWithReplacementAsync` | same |
| `cycle` | `cycleSync` | `cycleAsync` | buffers a one-shot source (e.g. a generator) on first pass so it can be replayed |
| `repeat` | `repeatSync` | `repeatAsync` | `times` optional, defaults to infinite |
| `starmap` | `starmapSync` | `starmapAsync` | — |
| *(recipe: `unique_everseen`)* | `uniqueSync` | `uniqueAsync` | not part of Python's core `itertools` module, but a documented recipe in its docs; global, unbounded-memory dedupe by key |
| `enumerate` (builtin, not `itertools`) | `enumerateSync` | `enumerateAsync` | included here for parity/completeness even though Python's `enumerate` isn't in `itertools` proper |
| *(no core equivalent)* | `group` (transducer) | via `transduceAsync` | fixed-size chunking; closest Python has is the 3.12+ `batched` |
| `some`/`every`/`find`/`forEach`/`reduce` (builtin `Iterator.prototype` methods, not `itertools`) | `someSync`/`everySync`/`findSync`/`forEachSync`/`foldSync` | `someAsync`/`everyAsync`/`findAsync`/`forEachAsync`/`foldAsync` | mirrors native ES2025 `Iterator.prototype` terminal methods, extended to async; `fold` is named to avoid colliding with this library's own `reduceSync`/`reduceAsync` (see below) |
| `min`/`max`/`next` (builtins, not `itertools`) | `minSync`/`maxSync`/`firstSync` | `minAsync`/`maxAsync`/`firstAsync` | `min`/`max` take an optional `key` function, matching Python's builtin argument order; see below for the empty-input divergence |
| *(no core equivalent — a list/collection idiom)* | `lastSync`/`nthSync` | `lastAsync`/`nthAsync` | — |
| *(recipe: `quantify`)* | `quantifySync` | `quantifyAsync` | named after the `quantify(iterable, pred=bool)` recipe documented in Python's own itertools docs; deliberately not named `count`, which already means something else here (see below) |
| *(recipe: `unique_justseen`)* | `dedupe` (transducer) | via `transduceAsync` | consecutive-only dedupe; the transducer-pipeline counterpart to `uniqueSync`/`uniqueAsync`'s global dedupe |
| *(no core equivalent — Clojure-inspired)* | `interpose` (transducer) | via `transduceAsync` | insert a separator between items |
| *(no core equivalent — the transducer-pipeline counterpart of `groupby`)* | `partitionBy` (transducer) | via `transduceAsync` | groups consecutive runs by key, like `groupBySync`, but as a composable pipeline stage rather than a standalone generator; distinct from the fixed-size `group` |
| *(no core equivalent — RxJS-inspired)* | `tap` (transducer) | via `transduceAsync` | side-effect-only pass-through, for debugging a pipeline |

## Design divergences

### `groupBySync`/`groupByAsync` vs. Python's `groupby`

Python's `itertools.groupby(iterable, key=None)` yields `(key, sub_iterator)`
pairs for *consecutive* runs sharing a key. Its sub-iterators are lazy and
are **invalidated by the next call to `next()`** on the outer iterator — a
well-documented footgun (materializing a sub-iterator from a prior group
after advancing past it silently yields nothing).

This library's `groupBySync`/`groupByAsync` eagerly materialize each run as
a plain array — `[key, items[]]` — instead. This is a deliberate safety
trade-off: no invalidation footgun, at the cost of holding one run's items
in memory at a time (the same memory profile Python's own docs recommend
falling back to, via `list(sub_iterator)`, whenever you need to keep a
group around).

Like Python's version, grouping is by **consecutive runs only** — it will
not merge non-adjacent occurrences of the same key. Sort the input first
(by the same key function) if you want every occurrence of a key merged
into a single group.

### Combinatorics `Async` variants are collect-then-compute, not streaming

`product`, `permutations`, `combinations`, and `combinationsWithReplacement`
are inherently "materialize fully, then compute" algorithms — true in
Python as well (CPython's own docs note that `product()` completely
consumes its input iterables before producing any output). This library's
`Async` variants (`productAsync`, `permutationsAsync`, `combinationsAsync`,
`combinationsWithReplacementAsync`) reflect that honestly: they `await` full
materialization of their async iterable source (reusing `exhaustAsync`),
then run the ordinary synchronous combinatorial algorithm and yield through
an async generator. There is no incremental/streaming combinatorial
generation as new source items arrive — if the source is unbounded, these
will never resolve.

### `quantify` avoids colliding with `count`, and `fold` avoids colliding with `reduce`

Two of the "terminal consumer" additions (`src/consumers.mjs`) needed names
other than their most obvious ones, because this library already uses those
names for something else:

- "Count items matching a predicate" would naturally be called `count`, but
  `countSync`/`countAsync`/`countBigSync`/`countBigAsync` already exist and
  mirror Python's `itertools.count` — an integer *sequence generator*, not
  an aggregator. Reusing the name for a completely different operation
  would be a real footgun, so `quantifySync`/`quantifyAsync` borrow the name
  of the actual documented Python recipe for this operation instead
  (`quantify` from the itertools docs' recipes section) rather than
  inventing a new one.
- "Reduce an iterable to one value" would naturally be called `reduce`, but
  `reduceSync`/`reduceAsync` (`src/iterator-tools.mjs`) already exist and
  are *not* a terminal reduce — they're an internal streaming primitive
  used by the transducer machinery that `yield*`s each intermediate result
  rather than returning a single final value. The terminal version is named
  `foldSync`/`foldAsync` instead, and requires an explicit `init` argument
  (unlike `Array.prototype.reduce`, which allows omitting it and using the
  first item as the seed) to sidestep replicating `reduce`'s well-known
  "throws on an empty array with no initial value" edge case.

### `find`/`first`/`last`/`nth`/`min`/`max` return `undefined`, not throw, on empty input

Python's builtin `min()`/`max()` raise `ValueError` on an empty iterable
unless a `default` is supplied. This library's `minSync`/`maxSync` (and
`findSync`/`firstSync`/`lastSync`/`nthSync`, none of which have a direct
Python `itertools`/builtin equivalent to diverge from, but are held to the
same house rule) return `undefined` instead, matching
`Array.prototype.find`'s behavior and this library's own native-mirrored
`findSync`. A caller-supplied `defaultValue` argument is always available
when `undefined` isn't the desired fallback.

### Native Iterator Helpers vs. Python's C-implemented iterator objects

Python's `itertools` functions are implemented in C for performance and
memory efficiency. This library's sync functions instead compose on top of
native ES2025 `Iterator.prototype` helpers where a helper directly covers
the behavior (see "Design philosophy," above) — meaning some of this
library's own hand-rolled code has, over its lifetime, been *replaced* by
just calling into the language runtime, rather than the more typical
trajectory of a userland library growing more of its own implementation
over time.

## Migration notes (coming from Python)

- **Naming convention**: every function is suffixed `Sync` or `Async`
  (`takeWhileSync`/`takeWhileAsync`) rather than Python's single name — pick
  the one matching your iterable's kind (or check with `isIterator`/
  `isAsyncIterator`/`exhaustable` from the core exports).
- **Argument order**: the `async-itertools/itertools` and
  `async-itertools/combinatorics` functions take the predicate/function
  first and the iterable(s) last, matching Python's `itertools` argument
  order (e.g. `takeWhileSync(predicate, iterable)`, `starmapSync(fn,
  iterableOfArgArrays)`), so a Python recipe should translate close to
  mechanically.
- **Currying**: the *transducer* functions in `async-itertools/transducers`
  (`map`, `filter`, `take`, `drop`, `reject`, `group`, `accumulate`) are
  curried factories meant for composition inside `transduceSync`/
  `transduceAsync` — a different shape from the flat itertools-parity
  functions above, and closer to Clojure's transducers than to Python's
  itertools. Don't expect `map(fn)(iterable)` to work the way
  `takeWhileSync(predicate, iterable)` does; transducers need to go through
  `transduceSync`/`transduceAsync`.
