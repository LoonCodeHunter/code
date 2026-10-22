import { PolicyEngine } from "kovari/security";
export * from "kovari/security";
/**
 * Build a conservative policy for coding tools. Model calls and workspace reads
 * are allowed; writes, subprocesses, network and tool effects require explicit
 * opt-in. The returned engine is a normal Kovari PolicyEngine and can be passed
 * to CommandExecutor, EditTransaction or createKovariCode().
 */
export function createCodePolicy(options = {}) {
    const commands = new Set(options.allowedCommands ?? []);
    return new PolicyEngine([({ effect, resource }) => {
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
//# sourceMappingURL=security.js.map