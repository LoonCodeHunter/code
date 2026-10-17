export { FakeModelProvider } from "kovari/testing";
export class FakeCommandExecutor {
    result;
    calls = [];
    constructor(result = { exitCode: 0, stdout: "", stderr: "", durationMs: 0, ok: true }) {
        this.result = result;
    }
    async run(request) { this.calls.push(request); return { ...this.result }; }
}
//# sourceMappingURL=testing.js.map