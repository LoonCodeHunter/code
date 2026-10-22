import { createKovari } from "kovari";
import { defineConfig, type Config } from "kovari/config";
import { Workspace } from "kovari/workspace";
import type { ModelProvider } from "kovari/models";
import { PolicyEngine } from "kovari/security";
import { CommandExecutor } from "./command.js";
import { EditTransaction } from "./edit.js";
import { GitRepository } from "./git.js";
import { RepositorySearch } from "./search.js";
import { createCodePolicy } from "./security.js";

export interface KovariCodeOptions {
  model: ModelProvider;
  config?: Partial<Config>;
  /** Custom authorization policy; without one, write/process effects are denied by default. */
  policy?: PolicyEngine;
}

export function createKovariCode(options: KovariCodeOptions) {
  const config = defineConfig(options.config);
  const policy = options.policy ?? createCodePolicy();
  const kovari = createKovari({ model: options.model, config });
  const workspace = new Workspace(config.workspaceRoot, config.limits.maxBytes);
  const commands = new CommandExecutor(policy);
  const git = new GitRepository(
    config.workspaceRoot,
    options.policy ? new CommandExecutor(options.policy) : undefined,
  );

  return Object.freeze({
    kovari,
    config,
    workspace,
    commands,
    git,
    search: new RepositorySearch(workspace, config.limits.concurrency),
    edit: () => new EditTransaction(workspace, policy),
  });
}

export default createKovariCode;
