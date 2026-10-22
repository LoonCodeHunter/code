import { PolicyEngine } from "kovari/security";
import type { Effect } from "kovari/security";

export * from "kovari/security";

export interface CodePolicyOptions {
  /** Executable names explicitly allowed through CommandExecutor. Defaults to none. */
  allowedCommands?: readonly string[];
  /** Allow write effects. Defaults to false; callers should enable this deliberately. */
  allowWrites?: boolean;
  /** Allow network effects. Defaults to false. */
  allowNetwork?: boolean;
  /** Allow tool effects. Defaults to false. */
  allowTools?: boolean;
}

/**
 * Build a conservative policy for coding tools. Model calls and workspace reads
 * are allowed; writes, subprocesses, network and tool effects require explicit
 * opt-in. The returned engine is a normal Kovari PolicyEngine and can be passed
 * to CommandExecutor, EditTransaction or createKovariCode().
 */
export function createCodePolicy(options: CodePolicyOptions = {}): PolicyEngine {
  const commands = new Set(options.allowedCommands ?? []);
  return new PolicyEngine([({ effect, resource }: { effect: Effect; resource?: string }) => {
    if (effect === "model" || effect === "read") {
      return { allow: true, reason: "Model and workspace-read effects are allowed by default" };
    }
    if (effect === "write" && options.allowWrites === true) {
      return { allow: true, reason: "Writes explicitly enabled by caller policy" };
    }
    if (effect === "process" && resource && commands.has(resource)) {
      return { allow: true, reason: `Executable ${resource} is allow-listed` };
    }
    if (effect === "network" && options.allowNetwork === true) {
      return { allow: true, reason: "Network effects explicitly enabled by caller policy" };
    }
    if (effect === "tool" && options.allowTools === true) {
      return { allow: true, reason: "Tool effects explicitly enabled by caller policy" };
    }
    return {
      allow: false,
      reason: `Effect '${effect}' requires an explicit allow rule${resource ? ` for '${resource}'` : ""}`,
    };
  }]);
}
