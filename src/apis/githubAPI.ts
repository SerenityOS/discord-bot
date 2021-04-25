import { Octokit } from "@octokit/rest";
import { GITHUB_TOKEN } from "../config/secrets";

class GithubAPI {
    private octokit: Octokit;

    constructor() {
        this.octokit = new Octokit({
            userAgent: "BuggieBot",
            auth: GITHUB_TOKEN,
        });
    }

    async search_issues(search_terms: string) {
        const qualifiers = [search_terms, "is:issue", "repo:SerenityOS/serenity"];
        const results = await this.octokit.search.issuesAndPullRequests({
            q: qualifiers.join("+"),
            per_page: 1,
            sort: "updated",
            order: "desc",
        });
        const {
            data: { items: issues },
        } = results;
        return issues[0];
    }

    async search_issue(issue_number: number) {
        try {
            const results = await this.octokit.issues.get({
                owner: "SerenityOS",
                repo: "serenity",
                issue_number,
            });
            return results.data;
        } catch {
            return undefined;
        }
    }

    async search_pull_requests(search_terms: string) {
        const qualifiers = [search_terms, "is:pull-request", "repo:SerenityOS/serenity"];
        const results = await this.octokit.search.issuesAndPullRequests({
            q: qualifiers.join("+"),
            per_page: 1,
            sort: "updated",
            order: "desc",
        });
        const {
            data: { items: pullRequests },
        } = results;
        return pullRequests[0];
    }
}

const api = new GithubAPI();
export default api;
