export function parseTypeScriptDiagnostics(text) { return text.split(/\r?\n/).flatMap(row => { const m = /^(.*)\((\d+),(\d+)\): (error|warning) (TS\d+): (.*)$/.exec(row); return m?.[1] && m[2] && m[3] && m[4] && m[5] && m[6] ? [{ source: "typescript", file: m[1], line: Number(m[2]), column: Number(m[3]), severity: m[4], code: m[5], message: m[6] }] : []; }); }
export class DiagnosticCollection {
    #items = [];
    add(...items) { this.#items.push(...items); return this; }
    all() { return Object.freeze([...this.#items]); }
    errors() { return this.#items.filter(x => x.severity === "error"); }
    clear() { this.#items = []; }
}
//# sourceMappingURL=diagnostics.js.map