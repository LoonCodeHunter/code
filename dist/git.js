import { CommandExecutor } from "./command.js";
export class GitRepository {
    root;
    commands;
    constructor(root, commands = new CommandExecutor()) {
        this.root = root;
        this.commands = commands;
    }
    async git(args) { const r = await this.commands.run({ command: "git", args, cwd: this.root }); if (!r.ok)
        throw Error(r.stderr || `git exited ${r.exitCode}`); return r.stdout.trim(); }
    status() { return this.git(["status", "--porcelain=v1", "--branch"]); }
    diff(staged = false) { return this.git(["diff", ...(staged ? ["--cached"] : []), "--no-ext-diff"]); }
    log(limit = 20) { if (!Number.isInteger(limit) || limit < 1 || limit > 500)
        throw RangeError("limit"); return this.git(["log", `-${limit}`, "--format=%H%x09%aI%x09%s"]); }
    show(ref = "HEAD") { return this.git(["show", "--stat", "--oneline", ref]); }
}
//# sourceMappingURL=git.js.map