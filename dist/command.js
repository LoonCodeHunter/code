import { spawn } from "node:child_process";
import { PolicyEngine } from "kovari/security";
import { EventBus } from "kovari/events";
export class CommandExecutor {
    policy;
    events;
    constructor(policy = new PolicyEngine(), events = new EventBus()) {
        this.policy = policy;
        this.events = events;
    }
    async run(r) { await this.policy.authorize({ effect: "process", resource: r.command }); const runId = crypto.randomUUID(), started = Date.now(); await this.events.emit("code.command.started", { command: r.command, args: r.args ?? [] }, runId); const signal = r.signal ? AbortSignal.any([r.signal, AbortSignal.timeout(r.timeoutMs ?? 120000)]) : AbortSignal.timeout(r.timeoutMs ?? 120000); try {
        const result = await new Promise((resolve, reject) => { const c = spawn(r.command, [...(r.args ?? [])], { cwd: r.cwd, shell: false, windowsHide: true, signal, env: r.env ? { ...process.env, ...r.env } : process.env }); let stdout = "", stderr = ""; c.stdout?.on("data", x => stdout += x); c.stderr?.on("data", x => stderr += x); c.once("error", reject); c.once("close", exitCode => resolve({ exitCode, stdout, stderr, durationMs: Date.now() - started, ok: exitCode === 0 })); });
        await this.events.emit("code.command.completed", result, runId);
        return result;
    }
    catch (error) {
        await this.events.emit("code.command.failed", { error }, runId);
        throw error;
    } }
}
//# sourceMappingURL=command.js.map