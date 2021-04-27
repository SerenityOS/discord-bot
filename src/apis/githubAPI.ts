/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Octokit } from "@octokit/rest";
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
    async fetch_serenity_manpage(
        section: string,
        page: string
    ): Promise<{ url: string; markdown: string }> {
        const request_path = `GET /repos/${this.repository}/contents/${this.man_path}/man${section}/${page}.md`;
        const results = await this.octokit.request(request_path);
        const markdown = Buffer.from(results.data["content"], "base64").toString("binary");

        return {
            url: `https://github.com/${this.repository}/blob/master/${this.man_path}/man${section}/${page}.md`,
            markdown,
        };
    }
}

const api = new GithubAPI();
export default api;
