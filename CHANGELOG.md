## Unreleased

- Bound child-process output capture per stream and added an explicit truncation marker.
- Enforce the workspace byte limit when planning file writes; re-check safe paths around temporary-file commits.
- Added regression tests for default-deny edits, explicit write approval, oversize edits and output truncation.

- Expand integration, security, CI and release documentation.
- Clarify the static source version badge and avoid reading the npm `latest` tag.

# Changelog
## 0.2.0 — 2026-10-20

- Correct the package version from the misleading `0.1.01` spelling to a proper semantic version.
- Add opt-in process/write policies: command execution is denied by default and file edits require an explicit policy.
- Allow the built-in Git facade to run through a narrow Git-only policy when the caller has not provided a custom policy.
- Use Kovari workspace safe-path checks during edits and add security regression tests.
- Fix the README version badge to refer to `@kovari/code`, not the unrelated `kovari` package.


## 0.1.1 (original package.json spelling: `0.1.01`)

- Integrated coding capabilities with `kovari@0.1.11` as a production dependency.
- Refreshed documentation and package imagery.
