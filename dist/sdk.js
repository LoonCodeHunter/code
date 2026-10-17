import { createKovari } from "kovari";
import { defineConfig } from "kovari/config";
import { Workspace } from "kovari/workspace";
import { CommandExecutor } from "./command.js";
import { EditTransaction } from "./edit.js";
import { GitRepository } from "./git.js";
import { RepositorySearch } from "./search.js";
export function createKovariCode(o) { const config = defineConfig(o.config), kovari = createKovari({ model: o.model, config }), workspace = new Workspace(config.workspaceRoot, config.limits.maxBytes), commands = new CommandExecutor(); return Object.freeze({ kovari, config, workspace, commands, git: new GitRepository(config.workspaceRoot, commands), search: new RepositorySearch(workspace, config.limits.concurrency), edit: () => new EditTransaction(workspace) }); }
export default createKovariCode;
//# sourceMappingURL=sdk.js.map