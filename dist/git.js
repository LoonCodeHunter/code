import { CommandExecutor } from "./command.js";
import { createCodePolicy } from "./security.js";
export class GitRepository {
    root;
    commands;
    constructor(root, commands = new CommandExecutor(createCodePolicy({ allowedCommands: ["git"] }))) {
        this.root = root;
        this.commands = commands;
    }
    async git(args) {
        const result = await this.commands.run({ command: "git", args, cwd: this.root });
        if (!result.ok)
            throw new Error(result.stderr || `git exited ${result.exitCode}`);
        return result.stdout.trim();
    }
    status() { return this.git(["status", "--porcelain=v1", "--branch"]); }
    diff(staged = false) { return this.git(["diff", ...(staged ? ["--cached"] : []), "--no-ext-diff"]); }
    log(limit = 20) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 500)
            throw new RangeError("limit");
        return this.git(["log", `-${limit}`, "--format=%H%x09%aI%x09%s"]);
    }
    show(ref = "HEAD") { return this.git(["show", "--stat", "--oneline", ref]); }
}
//# sourceMappingURL=git.js.map