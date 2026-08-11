#!/usr/bin/env node
// Regression guard for this package's CJS/ESM interop story: rather than
// shipping a separate CJS build (see docs/discussion/python-itertools.md /
// readme.md's "CommonJS / require()" section for the rationale), this
// package relies on Node's native `require(esm)` support (stable/unflagged
// since Node 22.12 -- see the `engines.node` floor in package.json). A
// future accidental top-level `await` or `import.meta` usage anywhere in
// the module graph would silently break plain `require()` for CJS
// consumers without touching any `import`-based test, so this script
// exercises `require()` against the compiled dist/ output and fails
// loudly if it breaks.
//
// Usage: npm run build && node scripts/require-esm-smoke-test.cjs

const assert = require("node:assert");
const path = require("node:path");

const m = require(path.join(__dirname, "..", "dist", "index.js"));

assert.strictEqual(typeof m.countSync, "function", "countSync must be require()-able");
assert.strictEqual(typeof m.someAsync, "function", "someAsync must be require()-able");
assert.deepStrictEqual([...m.countSync(0, 3)], [0, 1, 2, 3], "countSync must work as a generator under require()");

console.log("require(esm) smoke test passed");
