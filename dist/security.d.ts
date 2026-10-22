import { PolicyEngine } from "kovari/security";
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
export declare function createCodePolicy(options?: CodePolicyOptions): PolicyEngine;
//# sourceMappingURL=security.d.ts.map