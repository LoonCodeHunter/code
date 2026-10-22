import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const output = execFileSync(
  "npm",
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  { encoding: "utf8" },
);
const [pack] = JSON.parse(output);
const paths = pack.files.map(({ path }) => path);
for (const required of [
  "package.json",
  "README.md",
  "dist/index.js",
  "dist/index.d.ts",
  "assets/icon.png",
]) {
  assert.ok(paths.includes(required), `Missing required package file: ${required}`);
}
assert.ok(paths.some((path) => path.startsWith("docs/")), "Missing published documentation files");
assert.ok(!paths.some((path) => /^(src|tests|scripts)\//.test(path)), "Development source/test/script file leaked");
console.log(`Package verified: ${pack.entryCount} files; docs included, development files excluded`);
