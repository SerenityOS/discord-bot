import { describe, expect, it, assert } from "vitest";
import githubAPI, { SERENITY_REPOSITORY } from "../src/apis/githubAPI";

import { GITHUB_TOKEN } from "../src/config/secrets";
import config from "../src/config/botConfig";

describe("githubApi", function () {
    it("Should be able to create quote PRs", async function (context) {
        // This test only exists to ease debugging of the openFortunesPullRequest
        // github API when attempting to reproduce a bug. Skip it by default.
        context.skip();

        // The test  if the environment is configured for serenity, or
        // if we don't have a github API token setup.
        assert.isFalse(
            SERENITY_REPOSITORY.owner === "SerenityOS",
            "We should never run this test against the real repo."
        );
        assert.isDefined(GITHUB_TOKEN, "We need a valid configured github token to run this test.");

        const fortunes = await githubAPI.fetchSerenityFortunes();
        fortunes.push({
            quote: "Testing 123",
            author: "unit tests",
            url: "http://example.com",
            // eslint-disable-next-line camelcase
            utc_time: Math.floor(Date.now() / 1000),
        });

        const commandIssuerNick = "Unit Test Executor";
        const pullRequestNumber = await githubAPI.openFortunesPullRequest(
            fortunes,
            commandIssuerNick,
            "unit tests"
        );

        assert.isDefined(
            pullRequestNumber,
            "We should retrieve a valid pull request number, undefined is an error"
        );
    });

    describe("fetchSerenityRepos", () => {
        it("Should be able to fetch repositories", async () => {
            const repos = await githubAPI.fetchSerenityRepos();

            expect(
                repos.filter(({ name }) => ["serenity", "jakt"].includes(name)).length
            ).to.be.greaterThanOrEqual(2);
        });

        it("Should filter repositories", async () => {
            const repos = await githubAPI.fetchSerenityRepos();

            expect(
                repos.filter(({ name }) => config.excludedRepositories.includes(name)).length
            ).to.be.lessThanOrEqual(0);
        });
    });
});
