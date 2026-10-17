export { Workspace as CodeWorkspace } from "kovari/workspace";
export type WorkspaceSnapshot = {
    root: string;
    files: readonly string[];
    capturedAt: number;
};
import { Workspace } from "kovari/workspace";
export declare function snapshotWorkspace(workspace: Workspace): Promise<WorkspaceSnapshot>;
//# sourceMappingURL=workspace.d.ts.map