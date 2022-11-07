/*
 * Copyright (c) 2021-2022, the SerenityOS developers.
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

/* eslint camelcase: [2, { "properties": "never" }] */
import { GITHUB_TOKEN } from "../config/secrets";
import { Octokit } from "@octokit/rest";
import { throttling as OctokitThrottling } from "@octokit/plugin-throttling";
import { composeCreatePullRequest } from "octokit-plugin-create-pull-request";
import config from "../config/botConfig";

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

export interface Repository {
    owner: string;
    name: string;
}

export interface Commit {
    html_url: string;
    sha: string;
    commit: {
        message: string;
    };
}

export const SERENITY_REPOSITORY = {
    owner: "SerenityOS",
    name: "serenity",
};

type SearchResultReturnType = Exclude<
    Awaited<ReturnType<Octokit["search"]["issuesAndPullRequests"]>>["data"]["items"],
    number
>;

export interface UserIssuesAndPulls {
    pulls: SearchResultReturnType;
    issues: SearchResultReturnType;
}

class GithubAPI {
    private readonly octokit: Octokit;
    private readonly manPath: string = "Base/usr/share/man";
    private readonly fortunesPath: string = "Base/res/fortunes.json";

    constructor() {
        this.octokit = new (Octokit.plugin(OctokitThrottling))({
            userAgent: "BuggieBot",
            auth: GITHUB_TOKEN,
            throttle: {
                onRateLimit: () => true,
                onSecondaryRateLimit: () => true,
            },
        });
    }

    async searchIssuesOrPulls(query: string, repository: Repository = SERENITY_REPOSITORY) {
        const qualifiers = [query, `repo:${repository.owner}/${repository.name}`];
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

    async getIssueOrPull(number: number, repository: Repository = SERENITY_REPOSITORY) {
        try {
            const results = await this.octokit.issues.get({
                owner: repository.owner,
                repo: repository.name,
                issue_number: number,
            });
            return results.data;
        } catch (e) {
            console.trace(e);
            return undefined;
        }
    }

    async getPull(number: number, repository: Repository = SERENITY_REPOSITORY) {
        try {
            const results = await this.octokit.pulls.get({
                owner: repository.owner,
                repo: repository.name,
                pull_number: number,
            });
            return results.data;
        } catch (e) {
            console.trace(e);
            return undefined;
        }
    }

    async getUser(author: string) {
        try {
            let username = author;
            if (author.includes("@")) {
                const search = await this.octokit.search.users({
                    q: `${author.includes("@") ? `${author} in:email` : `user:${author}`}:`,
                    per_page: 1,
                });

                if (search.data.total_count <= 0)
                    throw new Error(`A GitHub user with the primary email ${author} was not found`);

                username = search.data.items[0].login;
            }

            const results = await this.octokit.users.getByUsername({
                username,
            });

            return results.data;
        } catch (e: any) {
            if (e.status === 404) return null;

            console.trace(e);
            throw e;
        }
    }

    async getCommitsCount(
        author: string,
        repository: Repository = SERENITY_REPOSITORY
    ): Promise<number | undefined> {
        try {
            const results = await this.octokit.search.commits({
                q: `${author.includes("@") ? "author-email" : "author"}:${author}+repo:${
                    repository.owner
                }/${repository.name}`,
                sort: "committer-date",
                order: "desc",
                per_page: 1,
            });

            return results.data?.total_count;
        } catch (e: any) {
            console.trace(e);
            throw e;
        }
    }

    async searchCommit(
        commitHash?: string,
        query?: string,
        repository: Repository = SERENITY_REPOSITORY
    ) {
        try {
            if (query) {
                const results = await this.octokit.search.commits({
                    q: `${query}+repo:${repository.owner}/${repository.name}`,
                    sort: "committer-date",
                    order: "desc",
                });
                return results.data;
            }

            const results = await this.octokit.request(
                "GET /repos/{owner}/{repo}/commits/{commit_sha}",
                {
                    commit_sha: commitHash,
                    owner: repository.owner,
                    repo: repository.name,
                }
            );
            return results.data;
        } catch (e) {
            console.trace(e);
            return undefined;
        }
    }

    async fetchSerenityManpageByUrl(url: string): Promise<ManPage | undefined> {
        const pattern =
            /https:\/\/github\.com\/([\w/]*)\/blob\/master\/([\w/]*)\/man(\d)\/([\w/]*)\.md/;
        const result = url.match(pattern);

        if (result === null) return;

        if (
            result[1] !== `${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}` ||
            result[2] !== this.manPath
        )
            return;

        return await this.fetchSerenityManpage(result[3], result[4]);
    }

    /* Attempts to fetch the content of a man page. */
    async fetchSerenityManpage(section: string, page: string): Promise<ManPage | undefined> {
        try {
            const repositoryPath = `${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}`;
            const path = `${this.manPath}/man${section}/${page}.md`;
            const requestPath = `GET /repos/${repositoryPath}/contents/${path}`;
            const results = await this.octokit.request(requestPath);
            const markdown = Buffer.from(results.data["content"], "base64").toString("binary");

            return {
                url: `https://github.com/${repositoryPath}/blob/master/${path}`,
                section,
                page,
                markdown,
            };
        } catch (e) {
            console.trace(e);
            return;
        }
    }

    async fetchSerenityFortunes(): Promise<Fortune[]> {
        const requestPath = `GET /repos/${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}/contents/${this.fortunesPath}`;
        const results = await this.octokit.request(requestPath);
        const json = Buffer.from(results.data["content"], "base64").toString("utf-8");
        return JSON.parse(json);
    }

    async openFortunesPullRequest(
        fortunes: Fortune[],
        triggeredBy: string,
        fortuneAuthor: string
    ): Promise<number | undefined> {
        const json = JSON.stringify(fortunes, null, 2);
        const result = await composeCreatePullRequest(this.octokit, {
            owner: SERENITY_REPOSITORY.owner,
            repo: SERENITY_REPOSITORY.name,
            title: `Base: Add a quote from ${fortuneAuthor} to the fortunes database`,
            body: `Triggered by ${triggeredBy} on Discord.`,
            head: `add-quote-${Math.floor(Date.now() / 1000)}`,
            changes: [
                {
                    files: {
                        [this.fortunesPath]: json + "\n",
                    },
                    commit: "Base: Add a quote to the fortunes database\n\n[skip ci]",
                },
            ],
        });
        if (result == null) {
            console.trace("Failed to create pull request");
            return;
        }
        return result.data.number;
    }

    async fetchUserIssuesAndPulls(username: string): Promise<UserIssuesAndPulls> {
        const queryOpts = {
            repo: `${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}`,
            author: username,
        };
        let userPulls: SearchResultReturnType = [];
        const pulls = await this.octokit.search.issuesAndPullRequests({
            q: Object.entries({ ...queryOpts, is: "pr" })
                .map(([k, v]) => k + ":" + v)
                .join("+"),
            per_page: 20,
        });
        if (pulls.status === 200) userPulls = pulls.data.items;
        let userIssues: SearchResultReturnType = [];
        const issues = await this.octokit.search.issuesAndPullRequests({
            q: Object.entries({ ...queryOpts, is: "issue" })
                .map(([k, v]) => k + ":" + v)
                .join("+"),
            per_page: 20,
        });
        if (issues.status === 200) userIssues = issues.data.items;
        return { pulls: userPulls, issues: userIssues };
    }

    async fetchSerenityRepos(): Promise<Repository[]> {
        const results = await this.octokit.repos.listForOrg({
            org: SERENITY_REPOSITORY.owner,
        });
        return results.data
            .map(repo => ({
                owner: repo.owner.login,
                name: repo.name,
            }))
            .filter(({ name }) => !config.excludedRepositories.includes(name));
    }
}

const api = new GithubAPI();
export default api;
