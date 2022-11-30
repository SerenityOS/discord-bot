/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ColorResolvable,
    CommandInteraction,
    EmbedBuilder,
    InteractionReplyOptions,
    time,
} from "discord.js";
import GithubAPI, { Repository } from "../apis/githubAPI";

import { GitHubColor } from "./color";
import { RestEndpointMethodTypes } from "@octokit/rest";
import { getSadCaret } from "./emoji";

export async function embedFromIssueOrPull(
    issueOrPull:
        | RestEndpointMethodTypes["issues"]["get"]["response"]["data"]
        | RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][0]
        | undefined
): Promise<EmbedBuilder | undefined> {
    if (!issueOrPull) return undefined;

    // FIXME: We already had this information in a nice format when fetching
    //        issueOrPull, find a way to include that object in the argument.
    const parts = issueOrPull.repository_url.split("/").reverse();
    const repository = {
        owner: parts[1],
        name: parts[0],
    };

    if (issueOrPull.pull_request) {
        const pull = await GithubAPI.getPull(issueOrPull.number, repository);

        if (pull) return embedFromPull(pull, repository);
    }

    return embedFromIssue(issueOrPull, repository);
}

export function embedFromIssue(
    issue:
        | RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][0]
        | RestEndpointMethodTypes["issues"]["get"]["response"]["data"],
    repository: Repository
): EmbedBuilder {
    let description = issue.body || "";
    if (description.length > 300) {
        description = description.slice(0, 300) + "...";
    }

    const color = issue.state === "open" ? GitHubColor.Open : GitHubColor.Merged;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${repository.name} #${issue.number}: ${issue.title}`)
        .setURL(issue.html_url)
        .setDescription(description || null)
        .addFields(
            { name: "Type", value: "Issue", inline: true },
            {
                name: "Created",
                value: `${time(new Date(issue.created_at), "R")}`,
                inline: true,
            },
            {
                name: "Comments",
                value: issue.comments.toString(),
                inline: true,
            },
            {
                name: "State",
                value: issue.state === "open" ? "Open" : "Closed",
                inline: true,
            }
        );

    const labels = issue.labels
        .map(label => (typeof label === "string" ? label : label.name))
        .filter(name => name !== undefined)
        .join(", ");

    if (labels.length !== 0) {
        embed.addFields({
            name: "Labels",
            value: labels,
            inline: true,
        });
    }

    if (issue.closed_at) {
        embed.addFields({
            name: "Closed",
            value: `${time(new Date(issue.closed_at), "R")}`,
            inline: true,
        });
    }

    if (issue.user != null) {
        embed.setAuthor({
            name: `@${issue.user.login}`,
            iconURL: issue.user.avatar_url,
            url: issue.user.html_url,
        });
    }

    return embed;
}

export function embedFromPull(
    pull: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"],
    repository: Repository
): EmbedBuilder {
    let description = pull.body || "";
    if (description.length > 300) {
        description = description.slice(0, 300) + "...";
    }

    const state = new Array<string>();

    let color: ColorResolvable;

    if (pull.draft) state.push("Draft");

    if (pull.merged) {
        color = GitHubColor.Merged;

        state.push("Merged");
    } else if (pull.state === "closed") {
        color = GitHubColor.Closed;

        state.push("Closed");
    } else {
        if (pull.draft) color = GitHubColor.Draft;
        else color = GitHubColor.Open;

        state.push("Open");
    }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${repository.name} #${pull.number}: ${pull.title}`)
        .setURL(pull.html_url)
        .setDescription(description || null)
        .addFields(
            { name: "Type", value: "Pull Request", inline: true },
            {
                name: "Created",
                value: `${time(new Date(pull.created_at), "R")}`,
                inline: true,
            },
            {
                name: "Commits",
                value: `${pull.commits} (+${pull.additions} -${pull.deletions})`,
                inline: true,
            },
            {
                name: "Comments",
                value: pull.comments.toString(),
                inline: true,
            },
            {
                name: "State",
                // @ts-expect-error Intl.ListFormat is not yet part of the typescript library definitions,
                //                  see https://github.com/microsoft/TypeScript/issues/46907
                value: new Intl.ListFormat().format(state),
                inline: true,
            }
        );

    const labels = pull.labels
        .map(label => label.name)
        .filter(name => name !== undefined)
        .join(", ");

    if (pull.labels.length !== 0) {
        embed.addFields({
            name: "Labels",
            value: labels,
            inline: true,
        });
    }

    if (pull.merged && pull.merged_at && pull.merged_by != null) {
        embed.addFields({
            name: "Merged",
            value: `${time(new Date(pull.merged_at), "R")} by [${pull.merged_by.login}](${
                pull.merged_by.html_url
            })`,
            inline: true,
        });
    }

    if (pull.user != null) {
        embed.setAuthor({
            name: `@${pull.user.login}`,
            iconURL: pull.user.avatar_url,
            url: pull.user.html_url,
        });
    }

    return embed;
}

export async function noMatchingFoundMessage(
    interaction: CommandInteraction
): Promise<InteractionReplyOptions> {
    const sadcaret = await getSadCaret(interaction);

    return {
        content: `No matching issues or pull requests found ${sadcaret ?? ":^("}`,
        ephemeral: true,
    };
}
