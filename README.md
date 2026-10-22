<div align="center">
  <img src="https://raw.githubusercontent.com/LoonCodeHunter/code/main/assets/icon.png" width="160" alt="Kovari Code package icon" />
  <h1>@kovari/code</h1>
  <p><strong>Repository intelligence and policy-controlled coding tools for Kovari Code IDE.</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@kovari/code"><img src="https://img.shields.io/badge/version-v0.2.0-6757ff?style=flat" alt="Version v0.2.0" /></a>
    <a href="https://www.npmjs.com/package/@kovari/code"><img src="https://img.shields.io/npm/dt/%40kovari%2Fcode?style=flat&amp;logo=npm&amp;logoColor=white&amp;label=downloads" alt="Downloads" /></a>
    <a href="https://github.com/LoonCodeHunter/code/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LoonCodeHunter/code/ci.yml?branch=main&amp;style=flat&amp;label=CI" alt="CI status" /></a>
    <a href="https://github.com/LoonCodeHunter/code/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-238636?style=flat&amp;logo=opensourceinitiative&amp;logoColor=white" alt="MIT licence" /></a>
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 20 or newer" />
    <a href="https://github.com/LoonCodeHunter/kovari"><img src="https://img.shields.io/badge/runtime-kovari%20%5E0.1.12-3c6e71?style=flat" alt="Kovari runtime dependency" /></a>
  </p>
</div>

> **Version badge policy:** the `version-v0.2.0` badge follows this repository's `package.json` version. It does not read the npm `latest` tag. The published package version may remain behind until this source version is released.

## Overview

`@kovari/code` adds coding-agent capabilities on top of the `kovari` runtime. It exposes repository search, workspace snapshots, transactional edits, Git operations, command execution, diagnostics and a composed SDK for building the developer-tool layer inside Kovari Code IDE.

The package does not call a particular hosted AI vendor by itself. Your application supplies a `ModelProvider`, configures workspace locations, and decides which file/process effects are approved. Version `0.2.0` introduces conservative defaults: **process execution and writes are denied unless a policy explicitly authorizes them**.

## What this package helps you build

- **Desktop IDE tools:** search code, inspect Git status/diffs, collect diagnostics and prepare planned edits.
- **Agentic workflows:** combine a model provider with structured workspace and repository context.
- **Human-in-the-loop coding:** preview a proposed edit set before authorizing and committing it.
- **Project analysis:** capture file lists, search text, inspect diagnostics and provide evidence back to an agent.
- **Testing tools:** use fake model/command providers to keep tests deterministic and offline.

## Compatibility and release line

| Item | Value |
|---|---|
| Source release | `0.2.0` |
| Node.js | `>=20` |
| npm | `>=10` |
| Module format | ESM |
| Runtime dependency | `kovari@^0.1.12` |
| Licence | MIT |

The dependency range `^0.1.11` permits compatible `0.1.x` patch releases of Kovari, including `0.1.12`. A local lockfile can still pin `0.1.11` for repeatable checks; downstream library consumers resolve dependencies according to npm's package-manager rules.

## Install

```bash
npm install @kovari/code
```

Use a clean-lockfile install when working from this repository:

```bash
npm ci
```

## Quick start

The fake provider makes this example deterministic and does not need an API key.

```ts
import createKovariCode from "@kovari/code";
import { FakeModelProvider } from "@kovari/code/testing";

const code = createKovariCode({
  model: new FakeModelProvider("Ready to help with this project."),
  config: { workspaceRoot: process.cwd() },
});

const result = await code.search.text("TODO", {
  extensions: [".ts", ".tsx", ".js"],
  limit: 25,
});

console.log(result);
```

Read/search operations are available under the default policy. Mutating files and launching commands require an explicit policy, as shown below.

## Policy-controlled effects

Kovari Code should be embedded in a permission-aware host. A UI can show the operation, request approval, then provide a policy that allows only the required effects.

### Default policy

```ts
import { createCodePolicy } from "@kovari/code";

const safeReadPolicy = createCodePolicy();
// Allows model/read effects; denies writes, processes, network and tools.
```

### Allow a specific process

```ts
import { CommandExecutor, createCodePolicy } from "@kovari/code";

const commands = new CommandExecutor(
  createCodePolicy({ allowedCommands: ["git"] }),
);

const status = await commands.run({
  command: "git",
  args: ["status", "--short"],
  cwd: process.cwd(),
  timeoutMs: 15_000,
});

if (!status.ok) throw new Error(status.stderr || `Git exited ${status.exitCode}`);
console.log(status.stdout);
```

`CommandExecutor` uses `spawn()` with `shell: false`, supports a timeout/cancellation signal, and emits start/completed/failed events. Allow-list executable names deliberately; never pass arbitrary model-generated command strings directly to a shell. The `maxOutputBytes` request option bounds captured stdout and stderr independently (default 1 MiB per stream, maximum 64 MiB); an overflow is drained but the returned text receives a clear truncation marker.

### Explicitly approve a write

```ts
import { PolicyEngine } from "kovari/security";
import { EditTransaction } from "@kovari/code";

const approvedPolicy = new PolicyEngine([
  ({ effect, resource }) => {
    if (effect === "write" && resource === "src/generated.ts") {
      return { allow: true, reason: "User approved this exact file" };
    }
    return { allow: false, reason: `Not approved: ${effect} ${resource ?? ""}` };
  },
]);

const transaction = new EditTransaction(code.workspace, approvedPolicy)
  .write("src/generated.ts", "export const generated = true;\n");

console.log(transaction.preview()); // Inspect paths and content before committing.
await transaction.commit();
```

This simple policy is illustrative. A production IDE should bind approvals to the current operation, verify the file set at commit time, handle stale file contents/conflicts, and communicate exactly what will change before authorizing a write.

## Create an SDK with a custom policy

```ts
import createKovariCode from "@kovari/code";
import { FakeModelProvider } from "@kovari/code/testing";
import { PolicyEngine } from "kovari/security";

const policy = new PolicyEngine([
  ({ effect, resource }) => {
    if (effect === "model" || effect === "read") return { allow: true };
    if (effect === "process" && resource === "git") return { allow: true, reason: "Git only" };
    if (effect === "write" && resource === "src/generated.ts") return { allow: true, reason: "User approved this path" };
    return { allow: false, reason: `Denied by the IDE policy: ${effect}` };
  },
]);

const code = createKovariCode({
  model: new FakeModelProvider("Plan ready"),
  config: { workspaceRoot: process.cwd() },
  policy,
});
```

All custom policies are application decisions. A `PolicyEngine` that permits an effect does not sandbox an executable or guarantee a model's output is safe.

## Main APIs

| API | Purpose | Notes |
|---|---|---|
| `createKovariCode(options)` | Creates the high-level coding SDK | Accepts `model`, optional `config` and optional `policy` |
| `RepositorySearch` / `code.search.text()` | Search text under a workspace | Use extension filters and result limits |
| `CodeWorkspace` | Kovari `Workspace` re-export | Version 0.1.12 rejects symlink components below the root |
| `EditTransaction` | Collect, preview and commit path/content changes | Default policy denies writes; inject an approved `PolicyEngine` |
| `CommandExecutor` | Run an executable with args | Default policy denies processes; use an explicit allow-list |
| `GitRepository` | Read status, diffs, logs and selected refs | Default executor allows the Git executable only |
| `parseTypeScriptDiagnostics()` | Convert TypeScript diagnostic text to structured records | Does not invoke TypeScript automatically |
| `DiagnosticCollection` | Store and query diagnostics | Host owns editor decorations and UI |
| `FakeModelProvider` | Deterministic model test double | From `@kovari/code/testing` |
| `FakeCommandExecutor` | Deterministic command test double | From `@kovari/code/testing` |
| `createCodePolicy()` | Build a conservative default policy | Fine-grained allow lists for commands/writes/network/tools |

## Workspace safety

Every path should be treated as untrusted, especially when it originates from a prompt, model output, extension manifest or repository content.

- Lexical paths must remain within the configured workspace root.
- Reads/writes/listing use Kovari `Workspace.safePath()` checks, which reject symlink components beneath the root.
- Edit transactions validate a target again before creating/replacing the output path.
- Do not treat these checks as an OS sandbox or protection against a hostile concurrent process changing filesystem entries between operations.
- Keep the workspace root narrow and use a temporary worktree for untrusted project generation where practical.

## Runtime architecture

```text
Your IDE / Desktop App / Backend
              |
              v
       createKovariCode()
              |
   +----------+-----------+
   |          |           |
   v          v           v
 Search    EditTransaction CommandExecutor
   |          |           |
   +------ Workspace -----+---- GitRepository
              |
              v
          kovari runtime
     Agent / ModelProvider / Events
```

The `kovari` package owns shared runtime interfaces. This package composes them with coding-specific operations. The desktop host owns permission dialogs and persistence; web browser code should call a trusted backend rather than run these Node.js filesystem/process APIs in the browser.

## Exports

Import from the public package surface or supported subpaths:

```ts
import createKovariCode, { CommandExecutor, EditTransaction, createCodePolicy } from "@kovari/code";
import { FakeModelProvider } from "@kovari/code/testing";
import { Workspace } from "kovari/workspace";
```

Supported subpaths are declared in `package.json` under `exports`; see [API.md](./API.md) for detail and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module boundaries.

## Development and release commands

Use Node.js `>=20` and npm `>=10`.

```bash
npm install
npm ci
npm run compiler:check
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npm run test:consumer
npm test
npm run validate
npm run check
npm run pack:verify
npm run pack:dry
npm run publish:dry
npm run release:check
npm run security
```

| Command | What it checks |
|---|---|
| `compiler:check` | Confirms the expected TypeScript compiler can be resolved |
| `typecheck` | Type-checks without emit |
| `build` | Regenerates compiled ESM and declarations |
| `test` | Runs unit, integration, security and consumer tests |
| `validate` | Checks source/package/assets/exports/lock/runtime integration/publish metadata |
| `pack:verify` | Verifies the npm tarball contents |
| `release:check` | Runs the full test/validation/packing pipeline |
| `security` | Runs `npm audit --audit-level=high`; registry access is required |

The `publish:dry` command is a local simulation; it cannot confirm npm ownership, two-factor settings, trusted publishing configuration or whether a name is restricted.

## Release `0.2.0` notes

- Normalises the previous `0.1.01` spelling to a valid, intentional semantic version.
- Defaults direct command execution and edit transactions to deny sensitive effects without explicit policy approval.
- Adds a policy helper and `createKovariCode({ policy })` option.
- Reuses workspace safe-path checks during edit commits.
- Adds tests for default-deny effects, explicit command allow-listing and symlink traversal.

Because defaults changed for commands and edits, this is a **minor pre-1.0 release** rather than a patch update. If you relied on the prior unrestricted defaults, update the app to provide an explicit policy before upgrading.

## Security checklist for IDE hosts

- Show the user the exact paths and commands before executing them.
- Limit executable names and argument shapes; avoid shell strings.
- Bound output bytes, timeouts, concurrency, file sizes and total request cost.
- Treat model output, repository files and extension metadata as untrusted.
- Keep credentials out of prompts, command environments and debug logs.
- Cancel outstanding work when the project/window closes.
- Run untrusted extensions in a separate constrained process or OS sandbox.

Report security issues through the repository's private/security disclosure instructions rather than placing exploit details in a public issue before a fix is available.

## Related projects

- [Kovari runtime](https://github.com/LoonCodeHunter/kovari)
- [KCIep package builder](https://github.com/LoonCodeHunter/kciep)
- [kciem-config trust/configuration package](https://github.com/LoonCodeHunter/kciem-config)
- [React Motion primitives](https://github.com/LoonCodeHunter/react-motion)

## Production integration guides

- [IDE host integration](./docs/IDE-HOST-INTEGRATION.md) — the operation lifecycle from request to reviewed edits and diagnostics.
- [Policy cookbook](./docs/POLICY-COOKBOOK.md) — conservative command and edit authorization, output limits and regression tests.
- [API reference](./API.md) · [Architecture](./ARCHITECTURE.md) · [Security notes](./SECURITY.md)

### Use in Kovari Code IDE

`@kovari/code` is the repository-aware tool layer. The desktop host supplies the natural-language interface, approval dialogs, active-workspace selection, visual diffs, terminal/log UI and rollback. Keep operations deny-by-default, approve only the intended command/path, and show users the changes before applying them to a real project.

## Licence

MIT. See [LICENSE](./LICENSE).

> **Automated publishing:** the GitHub Release workflow needs an Actions repository secret named `NPM_TOKEN` with publish permission, unless you deliberately configure npm trusted publishing and adapt the workflow to it. Never commit the token.


---

*Kovari Code IDE ecosystem: `www.kovaricode.com` is planned; the website link will be activated after the domain and site are live.*
