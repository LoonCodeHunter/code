import { type Config } from "kovari/config";
import { Workspace } from "kovari/workspace";
import type { ModelProvider } from "kovari/models";
import { CommandExecutor } from "./command.js";
import { EditTransaction } from "./edit.js";
import { GitRepository } from "./git.js";
import { RepositorySearch } from "./search.js";
export declare function createKovariCode(o: {
    model: ModelProvider;
    config?: Partial<Config>;
}): Readonly<{
    kovari: any;
    config: Readonly<Config>;
    workspace: Workspace;
    commands: CommandExecutor;
    git: GitRepository;
    search: RepositorySearch;
    edit: () => EditTransaction;
}>;
export default createKovariCode;
//# sourceMappingURL=sdk.d.ts.map