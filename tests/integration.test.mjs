import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  CommandExecutor,
  EditTransaction,
  Workspace,
  createCodePolicy,
} from "../dist/index.js";

test("command execution is denied unless a process is explicitly allow-listed", async () => {
  const executor = new CommandExecutor();
  await assert.rejects(
    executor.run({ command: process.execPath, args: ["-e", "process.stdout.write('should not run')"] }),
    /Policy denied process/i,
  );
});

test("command can run when the executable is explicitly allow-listed", async () => {
  const executor = new CommandExecutor(createCodePolicy({ allowedCommands: [process.execPath] }));
  const result = await executor.run({ command: process.execPath, args: ["-e", "process.stdout.write('ok')"] });
  assert.equal(result.stdout, "ok");
  assert.equal(result.ok, true);
});

test("command output capture is bounded and clearly marked when truncated", async () => {
  const executor = new CommandExecutor(createCodePolicy({ allowedCommands: [process.execPath] }));
  const result = await executor.run({
    command: process.execPath,
    args: ["-e", "process.stdout.write('x'.repeat(8192))"],
    maxOutputBytes: 1024,
  });
  assert.equal(result.ok, true);
  assert.ok(result.stdout.startsWith("x".repeat(1024)));
  assert.match(result.stdout, /\[stdout truncated after 1024 bytes\]/);
  assert.ok(Buffer.byteLength(result.stdout, "utf8") < 1100);
});

test("edit transaction denies writes unless the caller explicitly allows them", async () => {
  const root = await mkdtemp(join(tmpdir(), "kovari-code-edit-denied-"));
  try {
    const workspace = new Workspace(root);
    const transaction = new EditTransaction(workspace).write("new.txt", "should not be written");
    await assert.rejects(transaction.commit(), /Policy denied write/i);
    await assert.rejects(readFile(join(root, "new.txt"), "utf8"), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("edit transaction writes inside the workspace when explicitly approved", async () => {
  const root = await mkdtemp(join(tmpdir(), "kovari-code-edit-allowed-"));
  try {
    const workspace = new Workspace(root, 64);
    const transaction = new EditTransaction(workspace, createCodePolicy({ allowWrites: true }));
    transaction.write("src/generated.ts", "export const generated = true;\n");
    const preview = await transaction.commit();
    assert.deepEqual(preview.paths, ["src/generated.ts"]);
    assert.equal(await readFile(join(root, "src/generated.ts"), "utf8"), "export const generated = true;\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("edit transaction rejects a file that exceeds the workspace byte limit", async () => {
  const root = await mkdtemp(join(tmpdir(), "kovari-code-edit-limit-"));
  try {
    const workspace = new Workspace(root, 4);
    const transaction = new EditTransaction(workspace, createCodePolicy({ allowWrites: true }));
    assert.throws(() => transaction.write("too-large.txt", "12345"), /file-size limit/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
