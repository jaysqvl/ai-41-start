import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const installedVersion = readJson("../node_modules/next/package.json").version;

function assertPatchedNext16(version, location) {
  assert.match(version, /^16\.\d+\.\d+$/, `${location} must use a stable Next.js 16 release`);
  const [, minor, patch] = version.split(".").map(Number);
  assert.ok(minor > 3 || (minor === 3 && patch >= 3),
    `${location}: Next.js ${version} is below the 16.3.3 fix for GHSA-p293-qw3h-jr36`);
}

// This is a dependency regression guard, not a Windows exploit reproduction.
// https://github.com/advisories/GHSA-p293-qw3h-jr36
test("the installed framework includes the upstream Windows path fix", () => {
  assertPatchedNext16(installedVersion, "installed next");
  assert.equal(installedVersion, readJson("../package-lock.json").packages["node_modules/next"].version);
});

test("every locked Next.js copy includes the upstream Windows path fix", () => {
  const lock = readJson("../package-lock.json");
  const copies = Object.entries(lock.packages).filter(([path]) => /(^|\/)node_modules\/next$/.test(path));
  assert.ok(copies.length > 0, "the lockfile must include Next.js");
  for (const [path, pkg] of copies) assertPatchedNext16(pkg.version, path);
});

// Exercise the actual upstream fix boundaries without writing cache files.
// https://github.com/vercel/next.js/commit/968b9fcb26bdeb8e0a861a9df05361474666d51b
test("route segments escape raw and encoded Windows separators", () => {
  const escapePathDelimiters = require("next/dist/shared/lib/router/utils/escape-path-delimiters.js").default;
  assert.equal(escapePathDelimiters("..\\..\\private"), "..%5C..%5Cprivate");
  assert.equal(escapePathDelimiters("..%5C..%5Cprivate", true), "..%255C..%255Cprivate");
  assert.equal(escapePathDelimiters("ordinary-page_1.json"), "ordinary-page_1.json");
});

// Next 14 used three lowercase cache kinds. Retain that mapping so the same
// boundary tests can demonstrate the vulnerable baseline before an upgrade.
const cacheKinds = Number(installedVersion.split(".")[0]) < 15
  ? ["fetch", "pages", "app"]
  : ["FETCH", "PAGES", "IMAGE", "APP_PAGE", "APP_ROUTE"];

for (const kind of cacheKinds) {
  test(`${kind} cache paths reject traversal and preserve ordinary nested keys`, () => {
    const FileSystemCache = require("next/dist/server/lib/incremental-cache/file-system-cache.js").default;
    const cache = Object.create(FileSystemCache.prototype);
    cache.serverDistDir = join(tmpdir(), "ai41-next-migration-check", ".next", "server");
    const root = kind.toUpperCase() === "FETCH"
      ? join(cache.serverDistDir, "..", "cache", "fetch-cache")
      : join(cache.serverDistDir, kind.toUpperCase() === "PAGES" ? "pages" : "app");
    assert.equal(cache.getFilePath("ordinary/page.json", kind), join(root, "ordinary/page.json"));
    for (const key of [
      join("..", "outside.json"),
      join("..", `${basename(root)}-sibling`, "outside.json"),
      join("ordinary", "..", "..", "outside.json"),
    ]) {
      assert.throws(() => cache.getFilePath(key, kind), /Invalid file path/, key);
    }
  });
}
