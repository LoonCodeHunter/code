import { PolicyEngine } from "kovari/security";
import { EventBus } from "kovari/events";
export interface CommandRequest {
    command: string;
    args?: readonly string[];
    cwd?: string;
    timeoutMs?: number;
    /** Maximum captured bytes per output stream. Defaults to 1 MiB; valid range is 1 byte to 64 MiB. */
    maxOutputBytes?: number;
    signal?: AbortSignal;
    env?: Readonly<Record<string, string>>;
}
export interface CommandResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
    ok: boolean;
}
export declare class CommandExecutor {
    readonly policy: PolicyEngine;
    readonly events: EventBus;
    constructor(policy?: PolicyEngine, events?: EventBus);
    run(request: CommandRequest): Promise<CommandResult>;
}
//# sourceMappingURL=command.d.ts.map