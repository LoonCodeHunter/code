import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { Workspace } from "kovari/workspace";
import { PolicyEngine } from "kovari/security";
import { createCodePolicy } from "./security.js";
export class EditTransaction {
    workspace;
    policy;
    #operations = [];
    constructor(workspace, policy = createCodePolicy()) {
        this.workspace = workspace;
        this.policy = policy;
    }
    write(path, content) {
        if (typeof content !== "string") {
            throw new TypeError("Edit content must be a string");
        }
        // Validate the lexical path at planning time, then re-check symlink
        // components asynchronously at commit time before touching the filesystem.
        this.workspace.path(path);
        const bytes = Buffer.byteLength(content, "utf8");
        if (bytes > this.workspace.maxBytes) {
            throw new RangeError(`Edit exceeds the workspace file-size limit (${bytes} > ${this.workspace.maxBytes} bytes)`);
        }
        this.#operations.push({ path, content });
        return this;
    }
    preview() {
        return Object.freeze({
            operations: Object.freeze(this.#operations.map((operation) => Object.freeze({ ...operation }))),
            paths: Object.freeze([...new Set(this.#operations.map((operation) => operation.path))]),
        });
    }
    async commit() {
        for (const operation of this.#operations) {
            await this.policy.authorize({ effect: "write", resource: operation.path });
            const target = await this.workspace.safePath(operation.path);
            const temporary = `${target}.${randomUUID()}.tmp`;
            await mkdir(dirname(target), { recursive: true });
            // Revalidate after creating parent directories. Workspace.safePath rejects
            // symlink components so a project-provided link cannot redirect this edit.
            await this.workspace.safePath(operation.path);
            try {
                await writeFile(temporary, operation.content, { encoding: "utf8", flag: "wx", mode: 0o600 });
                // Validate again just before replacement to reduce symlink-swap exposure.
                await this.workspace.safePath(operation.path);
                await rename(temporary, target);
            }
            catch (error) {
                // Remove a partial temp file when a write fails, without masking the
                // original error if cleanup also fails.
                try {
                    await rm(temporary, { force: true });
                }
                catch { /* best effort */ }
                throw error;
            }
        }
        return this.preview();
    }
}
//# sourceMappingURL=edit.js.map