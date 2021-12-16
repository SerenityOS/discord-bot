/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { RestEndpointMethodTypes } from "@octokit/rest";
import {
    ApplicationCommandOptionData,
    ChatInputApplicationCommandData,
    ColorResolvable,
    CommandInteraction,
    MessageEmbed,
} from "discord.js";
import githubAPI from "../apis/githubAPI";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

const enum GitHubColor {
    Open = "#57ab5a",
    Closed = "#e5534b",
    Merged = "#6e40c9",
    Draft = "#768390",
}

export class GithubCommand extends Command {
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        const options: Array<ApplicationCommandOptionData> = [
            {
                name: "number",
                description: "The issue or pull request number",
                type: "NUMBER",
            },
            {
                name: "query",
                description: "A string to query issues and pull requests with",
                type: "STRING",
            },
        ];

        const description = "Link an issue or pull request";

        return [
            {
                name: "github",
                description,
                options,
            },
            {
                name: "issue",
                description,
                options,
            },
            {
                name: "pull",
                description,
                options,
            },
        ];
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        const number = interaction.options.getNumber("number");
        const query = interaction.options.getString("query");

        if (number !== null) {
            const result = await this.embedFromIssueOrPull(await githubAPI.getIssueOrPull(number));

            if (result) return await interaction.reply({ embeds: [result] });
        }

        if (query) {
            const result = await this.embedFromIssueOrPull(
                await githubAPI.searchIssuesOrPulls(query)
            );

            if (result) return await interaction.reply({ embeds: [result] });
        }

        const sadcaret = await getSadCaret(interaction);

        await interaction.reply({
            content: `No matching issues or pull requests found ${sadcaret ?? ":^("}`,
            ephemeral: true,
        });
    }

    private async embedFromIssueOrPull(
        issueOrPull: RestEndpointMethodTypes["issues"]["get"]["response"]["data"] | undefined
    ): Promise<MessageEmbed | undefined> {
        if (!issueOrPull) return undefined;

        if (issueOrPull.pull_request) {
            const pull = await githubAPI.getPull(issueOrPull.number);

            if (pull) return this.embedFromPull(pull);
        }

        return this.embedFromIssue(issueOrPull);
    }

    private embedFromIssue(
        issue: RestEndpointMethodTypes["issues"]["get"]["response"]["data"]
    ): MessageEmbed {
        let description = issue.body || "";
        if (description.length > 300) {
            description = description.slice(0, 300) + "...";
        }

        const color = issue.state === "open" ? GitHubColor.Open : GitHubColor.Merged;

        const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(issue.title)
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
                `<t:${new Date(issue.closed_at).valueOf() / 1000}:R> by [${
                    issue.closed_by.login
                }](${issue.closed_by.html_url})`,
                true
            );
        }

        if (issue.user != null) {
            embed.setAuthor(`@${issue.user.login}`, issue.user.avatar_url, issue.user.html_url);
        }

        return embed;
    }

    private embedFromPull(
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
            .setTitle(pull.title)
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
            embed.setAuthor(`@${pull.user.login}`, pull.user.avatar_url, pull.user.html_url);
        }

        return embed;
    }
}
