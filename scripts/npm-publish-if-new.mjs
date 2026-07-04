#!/usr/bin/env node
// Publishes the current package.json version if it isn't on npm yet.
//
// Single-package repo, so there's no per-directory eligibility flag to
// check (contrast with johnhenry/lib's scripts/npm-publish-eligible.mjs,
// which scans many version directories) -- the version field itself is
// the signal: bump it in a PR, merge, and CI publishes it.
//
// Usage: node scripts/npm-publish-if-new.mjs
// Requires NODE_AUTH_TOKEN. Exits non-zero on publish failure; exits 0
// (without publishing) if the current version is already on the registry.

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf8"));
const spec = `${pkg.name}@${pkg.version}`;

const npm = (args) => spawnSync("npm", args, { cwd: ROOT, encoding: "utf8" });

const view = npm(["view", spec, "version"]);
if (view.status === 0 && view.stdout.trim() !== "") {
  console.log(`⏭️  skip ${spec}: already published`);
  process.exit(0);
}

console.log(`🚀 publishing ${spec} ...`);
const publish = spawnSync(
  "npm",
  ["publish", "--provenance", "--access", "public"],
  { cwd: ROOT, stdio: "inherit" }
);
process.exit(publish.status ?? 1);
