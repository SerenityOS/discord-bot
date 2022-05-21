/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { RestEndpointMethodTypes } from "@octokit/rest";
import {
    ColorResolvable,
    CommandInteraction,
    InteractionReplyOptions,
    MessageEmbed,
} from "discord.js";
import GithubAPI from "../apis/githubAPI";
import { getSadCaret } from "./emoji";

export const enum GitHubColor {
    Open = "#57ab5a",
    Closed = "#e5534b",
    Merged = "#6e40c9",
    Draft = "#768390",
}

export async function embedFromIssueOrPull(
    issueOrPull: RestEndpointMethodTypes["issues"]["get"]["response"]["data"] | undefined
): Promise<MessageEmbed | undefined> {
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

        if (pull) return embedFromPull(pull);
    }

    return embedFromIssue(issueOrPull);
}

export function embedFromIssue(
    issue: RestEndpointMethodTypes["issues"]["get"]["response"]["data"]
): MessageEmbed {
    let description = issue.body || "";
    if (description.length > 300) {
        description = description.slice(0, 300) + "...";
    }

    const color = issue.state === "open" ? GitHubColor.Open : GitHubColor.Merged;

    const embed = new MessageEmbed()
        .setColor(color)
        .setTitle(`#${issue.number}: ${issue.title}`)
        .setURL(issue.html_url)
        .setDescription(description)
        .addField("Type", "Issue", true)
        .addField("Created", `<t:${new Date(issue.created_at).valueOf() / 1000}:R>`, true)
        .addField("Comments", issue.comments.toString(), true)
        .addField("State", issue.state === "open" ? "Open" : "Closed", true);

    const labels = issue.labels
        .map(label => (typeof label === "string" ? label : label.name))
        .filter(name => name !== undefined)
        .join(", ");

    if (labels.length !== 0) {
        embed.addField("Labels", labels, true);
    }

    if (issue.closed_at && issue.closed_by != null) {
        embed.addField(
            "Closed",
            `<t:${new Date(issue.closed_at).valueOf() / 1000}:R> by [${issue.closed_by.login}](${
                issue.closed_by.html_url
            })`,
            true
        );
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
    pull: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"]
): MessageEmbed {
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

    const embed = new MessageEmbed()
        .setColor(color)
        .setTitle(`#${pull.number}: ${pull.title}`)
        .setURL(pull.html_url)
        .setDescription(description)
        .addField("Type", "Pull Request", true)
        .addField("Created", `<t:${new Date(pull.created_at).valueOf() / 1000}:R>`, true)
        .addField("Commits", `${pull.commits} (+${pull.additions} -${pull.deletions})`, true)
        .addField("Comments", pull.comments.toString(), true)
        // @ts-expect-error Intl.ListFormat is not yet part of the typescript library definitions,
        //                  see https://github.com/microsoft/TypeScript/issues/46907
        .addField("State", new Intl.ListFormat().format(state), true);

    const labels = pull.labels
        .map(label => label.name)
        .filter(name => name !== undefined)
        .join(", ");

    if (pull.labels.length !== 0) {
        embed.addField("Labels", labels, true);
    }

    if (pull.merged && pull.merged_at && pull.merged_by != null) {
        embed.addField(
            "Merged",
            `<t:${new Date(pull.merged_at).valueOf() / 1000}:R> by [${pull.merged_by.login}](${
                pull.merged_by.html_url
            })`,
            true
        );
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
