export { FakeModelProvider } from "kovari/testing";
export declare class FakeCommandExecutor {
    private result;
    readonly calls: unknown[];
    constructor(result?: {
        exitCode: number;
        stdout: string;
        stderr: string;
        durationMs: number;
        ok: boolean;
    });
    run(request: unknown): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
        durationMs: number;
        ok: boolean;
    }>;
}
//# sourceMappingURL=testing.d.ts.map