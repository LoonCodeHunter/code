# Policy Cookbook for Coding Tools

All examples assume `@kovari/code` is installed and the code runs in a trusted Node.js process. They are starting points—not a replacement for a threat model.

## Default-deny policy

```ts
import { CommandExecutor, createCodePolicy } from "@kovari/code";

const executor = new CommandExecutor(createCodePolicy());
// A process request is denied until the host explicitly allow-lists it.
await executor.run({ command: "git", args: ["status", "--short"] });
```

The example intentionally rejects the command because the default policy does not allow child processes. Do not catch this error and continue as if the command succeeded.

## Allow one exact executable

```ts
import { CommandExecutor, createCodePolicy } from "@kovari/code";

const executor = new CommandExecutor(
  createCodePolicy({ allowedCommands: ["/usr/bin/git"] }),
);
const result = await executor.run({
  command: "/usr/bin/git",
  args: ["status", "--short"],
  timeoutMs: 10_000,
  maxOutputBytes: 128 * 1024,
});
if (!result.ok) throw new Error(`git exited with ${result.exitCode}: ${result.stderr}`);
```

Prefer an absolute executable path resolved by the host. The allow-list compares the command string that the request supplies; normalise/resolve executable paths in your host before policy approval.

## Preview and approve file edits

```ts
import { EditTransaction, Workspace, createCodePolicy } from "@kovari/code";

const workspace = new Workspace("./generated-project", 1_000_000);
const transaction = new EditTransaction(workspace, createCodePolicy({ allowWrites: true }));
transaction.write("src/generated.ts", "export const ready = true;\n");
const proposal = transaction.preview();
console.log(proposal.paths); // Present this to the user before commit.
// Only after the host confirms this exact preview:
await transaction.commit();
```

This example demonstrates a narrow policy, but a production UI should create a short-lived policy for the exact approved paths and re-check that the preview still matches at commit time. Do not keep `allowWrites: true` enabled globally while processing untrusted prompts.

## Resource bounds

`CommandExecutor` has a default output capture cap of 1 MiB per stream; callers may lower or raise `maxOutputBytes` up to 64 MiB. The child process output is still drained after capture truncation so the process can close normally, but the returned text includes a truncation marker. Use timeouts for every command and avoid feeding unbounded output back to a model.

`EditTransaction.write()` rejects content larger than the workspace's `maxBytes` limit. This is an additional resource guard, not permission to write: the commit still requires a policy decision.

## Security tests to keep in CI

- Default policy denies child processes.
- An exact allow-listed executable can run with a bounded timeout.
- Output capture does not grow without bound and includes a truncation marker.
- Edits are denied without explicit write permission.
- Approved edits are created only under the configured workspace.
- Oversize file contents are rejected before the commit.
- Symlink escapes are rejected by `Workspace.safePath()`.
