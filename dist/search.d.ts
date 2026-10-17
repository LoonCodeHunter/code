import { Workspace } from "kovari/workspace";
export interface SearchMatch {
    path: string;
    line: number;
    column: number;
    text: string;
}
export declare class RepositorySearch {
    private workspace;
    private concurrency;
    constructor(workspace: Workspace, concurrency?: number);
    text(query: string, o?: {
        caseSensitive?: boolean;
        limit?: number;
        extensions?: readonly string[];
    }): Promise<SearchMatch[]>;
}
//# sourceMappingURL=search.d.ts.map