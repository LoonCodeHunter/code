import { Workspace } from "kovari/workspace";
import { PolicyEngine } from "kovari/security";
export interface PlannedEdit {
    path: string;
    content: string;
}
export declare class EditTransaction {
    #private;
    private workspace;
    private policy;
    constructor(workspace: Workspace, policy?: PolicyEngine);
    write(path: string, content: string): this;
    preview(): Readonly<{
        operations: Readonly<{
            path: string;
            content: string;
        }>[];
        paths: readonly string[];
    }>;
    commit(): Promise<Readonly<{
        operations: Readonly<{
            path: string;
            content: string;
        }>[];
        paths: readonly string[];
    }>>;
}
//# sourceMappingURL=edit.d.ts.map