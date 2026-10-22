import { CommandExecutor } from "./command.js";
export declare class GitRepository {
    readonly root: string;
    private readonly commands;
    constructor(root: string, commands?: CommandExecutor);
    private git;
    status(): Promise<string>;
    diff(staged?: boolean): Promise<string>;
    log(limit?: number): Promise<string>;
    show(ref?: string): Promise<string>;
}
//# sourceMappingURL=git.d.ts.map