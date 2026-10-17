export interface Diagnostic {
    source: string;
    severity: "error" | "warning";
    message: string;
    file?: string;
    line?: number;
    column?: number;
    code?: string;
}
export declare function parseTypeScriptDiagnostics(text: string): Diagnostic[];
export declare class DiagnosticCollection {
    #private;
    add(...items: Diagnostic[]): this;
    all(): readonly Diagnostic[];
    errors(): Diagnostic[];
    clear(): void;
}
//# sourceMappingURL=diagnostics.d.ts.map