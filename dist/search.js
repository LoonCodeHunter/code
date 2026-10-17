import { Workspace } from "kovari/workspace";
import { Semaphore } from "kovari/runtime";
export class RepositorySearch {
    workspace;
    concurrency;
    constructor(workspace, concurrency = 4) {
        this.workspace = workspace;
        this.concurrency = concurrency;
    }
    async text(query, o = {}) { const needle = o.caseSensitive ? query : query.toLowerCase(), limit = o.limit ?? 200, out = [], sem = new Semaphore(this.concurrency); await Promise.all((await this.workspace.files()).map(path => sem.run(async () => { if (out.length >= limit || o.extensions?.length && !o.extensions.some(e => path.endsWith(e)))
        return; let text = ""; try {
        text = await this.workspace.read(path);
    }
    catch {
        return;
    } for (const [i, line] of text.split(/\r?\n/).entries()) {
        const column = (o.caseSensitive ? line : line.toLowerCase()).indexOf(needle);
        if (column >= 0 && out.length < limit)
            out.push({ path, line: i + 1, column: column + 1, text: line });
    } }))); return out.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line).slice(0, limit); }
}
//# sourceMappingURL=search.js.map