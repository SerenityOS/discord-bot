/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { RestEndpointMethodTypes } from "@octokit/rest";
import {
    ChatInputApplicationCommandData,
    ApplicationCommandOptionData,
    ColorResolvable,
    MessageEmbed,
    BaseCommandInteraction,
} from "discord.js";
import githubAPI from "../apis/githubAPI";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

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

    override async run(interaction: BaseCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

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

        const color = issue.state === "open" ? "#57ab5a" : "#e5534b";

        const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(issue.title)
            .setURL(issue.html_url)
            .setDescription(description)
            .addField("Type", "Issue", true)
            .addField("Created", new Date(issue.created_at).toDateString(), true)
            .addField("Comments", issue.comments.toString(), true);

        const labels = issue.labels
            .map(label => (typeof label === "string" ? label : label.name))
            .filter(name => name !== undefined)
            .join(", ");

        if (labels.length !== 0) {
            embed.addField("Labels", labels);
        }

        if (issue.closed_at && issue.closed_by != null) {
            embed.addField(
                "Closed",
                `${new Date(issue.closed_at).toDateString()} by ${issue.closed_by.login}`,
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

        let color: ColorResolvable;

        if (pull.draft) {
            color = "#768390";
        } else if (pull.merged) {
            color = "#6e40c9";
        } else {
            color = pull.state === "open" ? "#57ab5a" : "#e5534b";
        }

        const embed = new MessageEmbed()
            .setColor(color)
            .setTitle(pull.title)
            .setURL(pull.html_url)
            .setDescription(description)
            .addField("Type", "Pull Request", true)
            .addField("Created", new Date(pull.created_at).toDateString(), true)
            .addField("Commits", `${pull.commits} (+${pull.additions} -${pull.deletions})`, true)
            .addField("Comments", pull.comments.toString(), true);

        const labels = pull.labels
            .map(label => label.name)
            .filter(name => name !== undefined)
            .join(", ");

        if (pull.labels.length !== 0) {
            embed.addField("Labels", labels);
        }

        if (pull.merged && pull.merged_at && pull.merged_by != null) {
            embed.addField(
                "Merged",
                `${new Date(pull.merged_at).toDateString()} by ${pull.merged_by.login}`,
                true
            );
        }

        if (pull.user != null) {
            embed.setAuthor(`@${pull.user.login}`, pull.user.avatar_url, pull.user.html_url);
        }

        return embed;
    }
}
