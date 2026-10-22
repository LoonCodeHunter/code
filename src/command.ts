import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PolicyEngine } from "kovari/security";
import { EventBus } from "kovari/events";
import { createCodePolicy } from "./security.js";

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

export class CommandExecutor {
  constructor(
    readonly policy: PolicyEngine = createCodePolicy(),
    readonly events = new EventBus(),
  ) {}

  async run(request: CommandRequest): Promise<CommandResult> {
    if (!request.command || request.command.includes("\0")) {
      throw new TypeError("command must be a non-empty executable name");
    }
    const timeoutMs = request.timeoutMs ?? 120_000;
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new RangeError("timeoutMs must be a positive integer");
    }
    const maxOutputBytes = request.maxOutputBytes ?? 1024 * 1024;
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1 || maxOutputBytes > 64 * 1024 * 1024) {
      throw new RangeError("maxOutputBytes must be an integer from 1 to 67108864");
    }

    await this.policy.authorize({ effect: "process", resource: request.command });
    const runId = randomUUID();
    const startedAt = Date.now();
    await this.events.emit("code.command.started", {
      command: request.command,
      args: request.args ?? [],
    }, runId);

    const signal = request.signal
      ? AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs);

    try {
      const result = await new Promise<CommandResult>((resolve, reject) => {
        const child = spawn(request.command, [...(request.args ?? [])], {
          cwd: request.cwd,
          shell: false,
          windowsHide: true,
          signal,
          env: request.env ? { ...process.env, ...request.env } : process.env,
        });
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        const stdoutState = { bytes: 0, truncated: false };
        const stderrState = { bytes: 0, truncated: false };
        const capture = (
          chunks: Buffer[],
          state: { bytes: number; truncated: boolean },
          chunk: Buffer | string,
        ) => {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = Math.max(0, maxOutputBytes - state.bytes);
          const kept = bytes.byteLength <= remaining ? bytes : bytes.subarray(0, remaining);
          if (kept.byteLength) chunks.push(kept);
          state.bytes += kept.byteLength;
          if (kept.byteLength < bytes.byteLength) state.truncated = true;
        };
        child.stdout?.on("data", (chunk: Buffer | string) => capture(stdoutChunks, stdoutState, chunk));
        child.stderr?.on("data", (chunk: Buffer | string) => capture(stderrChunks, stderrState, chunk));
        child.once("error", reject);
        child.once("close", (exitCode) => {
          const marker = (name: string) => `\n[${name} truncated after ${maxOutputBytes} bytes]`;
          const stdout = Buffer.concat(stdoutChunks).toString("utf8") + (stdoutState.truncated ? marker("stdout") : "");
          const stderr = Buffer.concat(stderrChunks).toString("utf8") + (stderrState.truncated ? marker("stderr") : "");
          resolve({
            exitCode,
            stdout,
            stderr,
            durationMs: Date.now() - startedAt,
            ok: exitCode === 0,
          });
        });
      });
      await this.events.emit("code.command.completed", result, runId);
      return result;
    } catch (error) {
      await this.events.emit("code.command.failed", { error }, runId);
      throw error;
    }
  }
}
