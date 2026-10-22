import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(pkg.name, "@kovari/code");
assert.equal(pkg.version, "0.2.0");
assert.equal(pkg.dependencies?.kovari, "^0.1.12");
assert.deepEqual(pkg.repository, { type: "git", url: "git+https://github.com/LoonCodeHunter/code.git" });
assert.equal(pkg.homepage, "https://github.com/LoonCodeHunter/code#readme");
assert.equal(pkg.bugs?.url, "https://github.com/LoonCodeHunter/code/issues");
console.log("Package metadata valid");
