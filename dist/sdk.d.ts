import { type Config } from "kovari/config";
import { Workspace } from "kovari/workspace";
import type { ModelProvider } from "kovari/models";
import { PolicyEngine } from "kovari/security";
import { CommandExecutor } from "./command.js";
import { EditTransaction } from "./edit.js";
import { GitRepository } from "./git.js";
import { RepositorySearch } from "./search.js";
export interface KovariCodeOptions {
    model: ModelProvider;
    config?: Partial<Config>;
    /** Custom authorization policy; without one, write/process effects are denied by default. */
    policy?: PolicyEngine;
}
export declare function createKovariCode(options: KovariCodeOptions): Readonly<{
    kovari: Readonly<{
        config: Readonly<Config>;
        workspace: Workspace;
        agent: import("kovari").Agent;
    }>;
    config: Readonly<Config>;
    workspace: Workspace;
    commands: CommandExecutor;
    git: GitRepository;
    search: RepositorySearch;
    edit: () => EditTransaction;
}>;
export default createKovariCode;
//# sourceMappingURL=sdk.d.ts.map