import { access, readFile } from "node:fs/promises";
const compiler = "node_modules/typescript/bin/tsc";
await access(compiler).catch(() => {
  throw new Error("TypeScript 5.9.3 is not installed. Run 'npm install --include=dev' before development or release checks.");
});
const manifest = JSON.parse(await readFile("node_modules/typescript/package.json", "utf8"));
if (manifest.name !== "typescript" || manifest.version !== "5.9.3") {
  throw new Error(`Expected typescript@5.9.3, found ${manifest.name}@${manifest.version}`);
}
console.log("Verified local TypeScript compiler: 5.9.3");
