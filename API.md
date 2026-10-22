# Public API Reference — `@kovari/code`

This reference describes the public exports declared by `package.json`. Use the root import for the complete coding-tool layer or a supported subpath for a focused dependency. Do not import private files under `dist/`.

## Main constructors

| Export | Purpose | Typical boundary |
|---|---|---|
| `createKovariCode(options)` | Compose Kovari, workspace, commands, Git, search and edit helpers | Create once per active project/session |
| `Workspace` / `CodeWorkspace` | Resolve/read/write paths within a configured workspace root | Treat all path inputs as untrusted |
| `RepositorySearch` | Search file contents under the workspace with a result limit and extensions filter | Use a query/limit suitable for the UI |
| `EditTransaction` | Build a previewable sequence of file writes and commit only after policy authorization | Show a diff/preview and approve the exact paths |
| `CommandExecutor` | Run an executable without a shell, with timeout, cancellation and bounded output capture | Allow-list exact executable paths |
| `GitRepository` | Read status, diff, log and show information through Git | Avoid passing untrusted command fragments |
| `createCodePolicy(options)` | Construct a default-deny policy for writes, subprocesses, network and tool effects | Opt into only the effects the current operation needs |
| `parseTypeScriptDiagnostics(text)` | Convert TypeScript CLI diagnostic lines to structured records | Keep original compiler output for debugging |
| `DiagnosticCollection` | Collect, query and clear structured diagnostics | Clear/replace diagnostics when a new run completes |

## `CommandExecutor`

```ts
interface CommandRequest {
  command: string;
  args?: readonly string[];
  cwd?: string;
  timeoutMs?: number;       // defaults to 120000
  maxOutputBytes?: number;  // defaults to 1 MiB per stream; range 1 byte..64 MiB
  signal?: AbortSignal;
  env?: Readonly<Record<string, string>>;
}
```

`run(request)` returns `exitCode`, `stdout`, `stderr`, `durationMs` and `ok`. If a stream exceeds its capture limit, the returned text is capped and a truncation marker is appended. The child continues to be drained so the process can close normally; always set an appropriate timeout for untrusted or long-running work.

The executor uses `spawn()` with `shell: false`. This avoids shell-string interpretation, but it does not make an executable safe by itself. The policy authorizes the `command` string; the IDE host should resolve executable paths and authorize the exact executable and arguments for the operation.

## `EditTransaction`

```ts
const transaction = code.edit().write(
  "src/generated.ts",
  "export const ready = true;\n",
);
const preview = transaction.preview();
// Present the operation paths and proposed content in the host UI.
await transaction.commit();
```

`preview()` is a read-only view of the planned operations and unique paths. `commit()` asks the configured `PolicyEngine` to authorize each write, checks the workspace path again, stages content into a temporary file, and then replaces the target. Content larger than the workspace's configured file-size limit is rejected during planning.

A production host should make approval specific to the current preview, handle conflicts/stale file contents, review diffs and keep a rollback path. Filesystem path checks reduce risk but do not replace OS-level isolation or eliminate every possible race against another process modifying the same directory.

## `createCodePolicy(options)`

| Option | Default | Effect |
|---|---|---|
| `allowedCommands` | `[]` | Exact executable strings permitted for `process` effects |
| `allowWrites` | `false` | Permit write effects only when explicitly set to `true` |
| `allowNetwork` | `false` | Permit network effects when enabled |
| `allowTools` | `false` | Permit tool effects when enabled |

Model and read effects are allowed by this helper. Unknown/unlisted effects are denied. For per-operation approvals, prefer a custom short-lived `PolicyEngine` instead of turning on a broad option globally.

## Workspace and search

- `Workspace.path(path)` provides lexical containment checks.
- `Workspace.safePath(path)` also rejects existing symlink components below the workspace root.
- `Workspace.read(path)` reads an in-root regular file within the configured byte limit.
- `Workspace.files(directory?)` returns sorted regular-file paths and does not traverse symlink entries.
- `RepositorySearch.text(query, options?)` supports `caseSensitive`, `limit` and `extensions`; results include `path`, one-based `line`/`column`, and matched `text`.

Do not concatenate raw model output into arbitrary absolute paths. Keep the active root narrow and use a temporary worktree for untrusted generated changes.

## Git and diagnostics

`GitRepository` provides `status()`, `diff(staged?)`, `log(limit?)` and `show(ref?)`. Git output is textual; the host remains responsible for rendering and deciding what to stage or commit. `log()` accepts a limit from 1 through 500.

`Diagnostic` records contain `source`, `severity`, `message` and optional `file`, `line`, `column` and `code`. `DiagnosticCollection` supports `add()`, `all()`, `errors()` and `clear()`.

## Supported imports

The package exports the root API plus `/core`, `/config`, `/events`, `/runtime`, `/security`, `/logging`, `/workspace`, `/command`, `/edit`, `/search`, `/git`, `/diagnostics`, `/testing` and `/sdk`. Confirm exact export targets in `package.json` for the version installed by your application.

## Compatibility

- ESM package; use `import` syntax in an ESM project.
- Node.js `>=20`, npm `>=10` as declared in package metadata.
- The `kovari` dependency is pinned by the lockfile to the compatible `0.1.12` line for this release.
- Review `SECURITY.md`, `ARCHITECTURE.md` and [the policy cookbook](./docs/POLICY-COOKBOOK.md) before wiring the APIs into a desktop extension host.
