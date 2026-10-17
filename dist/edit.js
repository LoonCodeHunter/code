import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { Workspace } from "kovari/workspace";
import { PolicyEngine } from "kovari/security";
export class EditTransaction {
    workspace;
    policy;
    #ops = [];
    constructor(workspace, policy = new PolicyEngine()) {
        this.workspace = workspace;
        this.policy = policy;
    }
    write(path, content) { this.workspace.path(path); this.#ops.push({ path, content }); return this; }
    preview() { return Object.freeze({ operations: this.#ops.map(x => Object.freeze({ ...x })), paths: Object.freeze([...new Set(this.#ops.map(x => x.path))]) }); }
    async commit() { for (const op of this.#ops) {
        await this.policy.authorize({ effect: "write", resource: op.path });
        const target = this.workspace.path(op.path), temp = `${target}.${randomUUID()}.tmp`;
        await mkdir(dirname(target), { recursive: true });
        await writeFile(temp, op.content, "utf8");
        await rename(temp, target);
    } return this.preview(); }
}
//# sourceMappingURL=edit.js.map