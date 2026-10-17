export { Workspace as CodeWorkspace } from "kovari/workspace";
import { Workspace } from "kovari/workspace";
export async function snapshotWorkspace(workspace) { return Object.freeze({ root: workspace.root, files: Object.freeze(await workspace.files()), capturedAt: Date.now() }); }
//# sourceMappingURL=workspace.js.map