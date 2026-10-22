# Kovari Code IDE Host Integration

`@kovari/code` is the coding-tool layer used by a host application. It provides repository search/edit/process primitives; the desktop product provides the UI, project lifecycle, permission prompts, terminal presentation, diagnostics panels and persistence.

## Recommended operation flow

1. Receive a user request and resolve the active workspace in the host.
2. Gather a small, relevant repository snapshot and diagnostics; exclude secrets and generated folders.
3. Ask the configured model provider for a plan, and present proposed operations before effectful work.
4. Build a policy that authorizes only the exact effects and executables approved for that run.
5. Use `EditTransaction.preview()` to show the paths and planned edits before `commit()`.
6. Re-check policy and workspace paths at commit time; show a diff and preserve rollback where practical.
7. Run approved commands with an explicit timeout and bounded output capture.
8. Capture structured results and diagnostic summaries, then ask the model to propose further changes if needed.
9. Stop event listeners and abort background work when the workspace closes or the user cancels.

## Keep permission UI in the host

The library's `PolicyEngine` returns decisions; it does not show a dialog. A safe host can request approval for a single operation and then pass a policy allowing only that operation. Avoid global “allow all writes and commands” toggles for untrusted generated code.

## Workspace isolation

Use a temporary worktree or generated-project directory for code produced from untrusted prompts. Show a file diff before applying changes to a user's real repository. Never expose model API keys in a browser bundle or extension process environment that untrusted code can inspect.

## Cancellation and lifecycle

Pass an `AbortSignal` to commands, use the host's cancellation token for longer model calls where supported, and remove event subscriptions on teardown. Treat the workspace closing as a reason to stop pending operations instead of allowing them to finish against a different active project.

## Observability

Record operation type, duration, status and redacted path count. Avoid logging prompts, private source contents, access tokens, environment values or complete command outputs by default. Provide an opt-in diagnostic export for reproducing bugs.
