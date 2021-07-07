/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

/* eslint camelcase: [2, { "properties": "never" }] */
import { Octokit } from "@octokit/rest";
import { GITHUB_TOKEN } from "../config/secrets";

export interface ManPage {
    url: string;
    section: string;
    page: string;
    markdown: string;
}

class GithubAPI {
    private readonly octokit: Octokit;

    private readonly repository: string = "SerenityOS/serenity";
    private readonly manPath: string = "Base/usr/share/man";

    constructor() {
        this.octokit = new Octokit({
            userAgent: "BuggieBot",
            auth: GITHUB_TOKEN,
        });
    }

    async searchIssues(searchTerms: string) {
        const qualifiers = [searchTerms, "is:issue", `repo:${this.repository}`];
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

    async searchIssue(issueNumber: number) {
        try {
            const results = await this.octokit.issues.get({
                owner: "SerenityOS",
                repo: "serenity",
                issue_number: issueNumber,
            });
            if (results.data.pull_request != null) {
                // This is a PR
                return undefined;
            }
            return results.data;
        } catch {
            return undefined;
        }
    }

    async searchPullRequests(searchTerms: string) {
        const qualifiers = [searchTerms, "is:pull-request", `repo:${this.repository}`];
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

    async searchPullRequest(pullNumber: number) {
        try {
            const results = await this.octokit.pulls.get({
                owner: "SerenityOS",
                repo: "serenity",
                pull_number: pullNumber,
            });
            return results.data;
        } catch {
            return undefined;
        }
    }

    async searchCommit(commitHash: string) {
        try {
            const results = await this.octokit.request(
                "GET /repos/{owner}/{repo}/commits/{commit_sha}",
                {
                    commit_sha: commitHash,
                    owner: "SerenityOS",
                    repo: "serenity",
                }
            );
            return results.data;
        } catch {
            return undefined;
        }
    }

    async fetchSerenityManpageByUrl(url: string): Promise<ManPage | undefined> {
        const pattern =
            /https:\/\/github\.com\/([\w/]*)\/blob\/master\/([\w/]*)\/man(\d)\/([\w/]*)\.md/;
        const result = url.match(pattern);

        if (result === null) return;

        if (result[1] !== this.repository || result[2] !== this.manPath) return;

        return await this.fetchSerenityManpage(result[3], result[4]);
    }

    /* Attempts to fetch the content of a man page. */
    async fetchSerenityManpage(section: string, page: string): Promise<ManPage | undefined> {
        try {
            const path = `${this.manPath}/man${section}/${page}.md`;
            const requestPath = `GET /repos/${this.repository}/contents/${path}`;
            const results = await this.octokit.request(requestPath);
            const markdown = Buffer.from(results.data["content"], "base64").toString("binary");

            return {
                url: `https://github.com/${this.repository}/blob/master/${path}`,
                section,
                page,
                markdown,
            };
        } catch {
            return;
        }
    }
}

const api = new GithubAPI();
export default api;
