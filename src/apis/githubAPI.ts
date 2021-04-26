import { Octokit } from "@octokit/rest";
import { Util } from "discord.js";
import { GITHUB_TOKEN } from "../config/secrets";

class GithubAPI {
    private octokit: Octokit;

    private readonly repository: string = "SerenityOS/serenity";
    private readonly man_path: string = "Base/usr/share/man";

    constructor() {
        this.octokit = new Octokit({
            userAgent: "BuggieBot",
            auth: GITHUB_TOKEN,
        });
    }

    async search_issues(search_terms: string) {
        const qualifiers = [search_terms, "is:issue", `repo:${this.repository}`];
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
            if (results.data.pull_request) {
                // This is a PR
                return undefined;
            }
            return results.data;
        } catch {
            return undefined;
        }
    }

    async search_pull_requests(search_terms: string) {
        const qualifiers = [search_terms, "is:pull-request", `repo:${this.repository}`];
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

    async search_pull_request(pull_number: number) {
        try {
            const results = await this.octokit.pulls.get({
                owner: "SerenityOS",
                repo: "serenity",
                pull_number,
            });
            return results.data;
        } catch {
            return undefined;
        }
    }

    /* Attempts to fetch the content of a man page. */
    async fetch_serenity_manpage(section: string, page: string): Promise<string> {
        const request_path = `GET /repos/${this.repository}/contents/${this.man_path}/man${section}/${page}.md`;
        const results = await this.octokit.request(request_path);
        const markdown = Buffer.from(results.data["content"], "base64").toString("binary");

        return this.envelope_in_markdown(markdown);
    }

    /* Utility to envelope content in markdown, including escaping code blocks. */
    private async envelope_in_markdown(markdown: string): Promise<string> {
        /* Escape code blocks so they don't break up the markdown message. */
        markdown = Util.cleanCodeBlockContent(markdown);

        /* Wrap the content in a markdown envelope. */
        markdown = "```markdown\n" + markdown;

        /* Discord only supports up to 2000 characters for messages. */
        markdown = markdown.substr(0, Math.min(markdown.length, 2000 - 8));
        markdown = markdown + "\n```";

        return markdown;
    }
}

const api = new GithubAPI();
export default api;
