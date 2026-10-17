import { access, readFile } from "node:fs/promises";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (pkg.name !== "@kovari/code" || pkg.version !== "0.1.0") throw new Error("Invalid package identity");
if (pkg.dependencies?.kovari !== "^0.1.1") throw new Error("Expected kovari@^0.1.1 dependency");
for (const path of ["dist/index.js", "dist/index.d.ts", "assets/icon.png", "README.md", "LICENSE"]) await access(path);
console.log("Prepack artefacts verified; no compiler installation required for npm pack");
