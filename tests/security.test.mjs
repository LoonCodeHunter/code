import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CodeWorkspace, EditTransaction, createCodePolicy } from "../dist/index.js";
import { PolicyEngine } from "kovari/security";

async function makeWorkspacePair() {
  const parent = await mkdtemp(join(tmpdir(), "kovari-code-security-"));
  const root = join(parent, "workspace");
  const outside = join(parent, "outside");
  await mkdir(root);
  await mkdir(outside);
  await writeFile(join(outside, "secret.txt"), "outside secret");
  return { parent, root, outside };
}

async function makeDirectorySymlink(t, target, linkPath) {
  try {
    await symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (process.platform === "win32" && ["EPERM", "EACCES", "UNKNOWN"].includes(error.code)) {
      t.skip("Windows symlink creation is unavailable for this account");
      return false;
    }
    throw error;
  }
  return true;
}

test("edit transaction refuses writes by default", async () => {
  const { parent, root } = await makeWorkspacePair();
  try {
    const transaction = new EditTransaction(new CodeWorkspace(root)).write("new.txt", "blocked");
    await assert.rejects(transaction.commit(), /Policy denied write/i);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("edit transaction succeeds with an explicit write policy", async () => {
  const { parent, root } = await makeWorkspacePair();
  try {
    const policy = new PolicyEngine([({ effect }) => effect === "write"
      ? { allow: true }
      : { allow: false, reason: "Only writes allowed by this test" }]);
    await new EditTransaction(new CodeWorkspace(root), policy).write("created.txt", "approved").commit();
    assert.equal(await readFile(join(root, "created.txt"), "utf8"), "approved");
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("edit transaction refuses to follow an outside-pointing symlink", async (t) => {
  const { parent, root, outside } = await makeWorkspacePair();
  const outsideFile = join(outside, "created.txt");
  try {
    if (!await makeDirectorySymlink(t, outside, join(root, "outside-link"))) return;
    const policy = new PolicyEngine([({ effect }) => effect === "write"
      ? { allow: true }
      : { allow: false, reason: "Only writes allowed by this test" }]);
    const transaction = new EditTransaction(new CodeWorkspace(root), policy)
      .write("outside-link/created.txt", "must not escape");
    await assert.rejects(transaction.commit(), /symlinks are not allowed/i);
    await assert.rejects(readFile(outsideFile, "utf8"), { code: "ENOENT" });
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("createCodePolicy allows only the configured command and explicit effects", async () => {
  const policy = createCodePolicy({ allowedCommands: ["git"], allowWrites: true });
  await policy.authorize({ effect: "process", resource: "git" });
  await assert.rejects(policy.authorize({ effect: "process", resource: "node" }), /Policy denied process/i);
  await policy.authorize({ effect: "write", resource: "src/file.ts" });
});
