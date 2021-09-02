/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

/* eslint camelcase: [2, { "properties": "never" }] */
import { GITHUB_TOKEN } from "../config/secrets";
import { Octokit } from "@octokit/rest";
import { composeCreatePullRequest } from "octokit-plugin-create-pull-request";

export interface ManPage {
    url: string;
    section: string;
    page: string;
    markdown: string;
}

export interface Fortune {
    quote: string;
    author: string;
    // eslint-disable-next-line camelcase
    utc_time: number;
    url: string;
    context?: string;
}

class GithubAPI {
    private readonly octokit: Octokit;

    private readonly repositoryOwner: string = "SerenityOS";
    private readonly repositoryName: string = "serenity";
    readonly repository: string = `${this.repositoryOwner}/${this.repositoryName}`;
    private readonly manPath: string = "Base/usr/share/man";
    private readonly fortunesPath: string = "Base/res/fortunes.json";

    constructor() {
        this.octokit = new Octokit({
            userAgent: "BuggieBot",
            auth: GITHUB_TOKEN,
        });
    }

    async searchIssuesOrPulls(query: string) {
        const qualifiers = [query, `repo:${this.repository}`];
        const results = await this.octokit.search.issuesAndPullRequests({
            q: qualifiers.join("+"),
            per_page: 1,
            sort: "updated",
            order: "desc",
        });
        const {
            data: { items },
        } = results;
        return items[0];
    }

    async getIssueOrPull(number: number) {
        try {
            const results = await this.octokit.issues.get({
                owner: "SerenityOS",
                repo: "serenity",
                issue_number: number,
            });
            return results.data;
        } catch {
            return undefined;
        }
    }

    async getPull(number: number) {
        try {
            const results = await this.octokit.pulls.get({
                owner: "SerenityOS",
                repo: "serenity",
                pull_number: number,
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

    async fetchSerenityFortunes(): Promise<Fortune[]> {
        const requestPath = `GET /repos/${this.repository}/contents/${this.fortunesPath}`;
        const results = await this.octokit.request(requestPath);
        const json = Buffer.from(results.data["content"], "base64").toString("utf-8");
        return JSON.parse(json);
    }

    async openFortunesPullRequest(
        fortunes: Fortune[],
        triggeredBy: string
    ): Promise<number | undefined> {
        const json = JSON.stringify(fortunes, null, 2);
        const result = await composeCreatePullRequest(this.octokit, {
            owner: this.repositoryOwner,
            repo: this.repositoryName,
            title: "Base: Add a quote to the fortunes database",
            body: `Triggered by ${triggeredBy} on Discord.`,
            head: `add-quote-${Math.floor(Date.now() / 1000)}`,
            changes: [
                {
                    files: {
                        [this.fortunesPath]: {
                            content: json + "\n",
                            encoding: "utf-8",
                        },
                    },
                    commit: "Base: Add a quote to the fortunes database\n\n[skip ci]",
                },
            ],
        });
        if (result == null) return;
        return result.data.number;
    }
}

const api = new GithubAPI();
export default api;
