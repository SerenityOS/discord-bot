/*
 * Copyright (c) 2022, U9G <git@u9g.dev>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    CommandInteraction,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    SelectMenuInteraction,
} from "discord.js";
import {
    embedFromIssueOrPull,
    noMatchingFoundMessage,
    GitHubColor,
} from "../util/embedFromIssueOrPull";
import githubAPI from "../apis/githubAPI";
import Command from "./command";
import {
    getClosedIssue,
    getClosedPull,
    getMergedPull,
    getOpenIssue,
    getOpenPull,
} from "../util/emoji";

export class UserCommand extends Command {
    override data(): ApplicationCommandData | ApplicationCommandData[] {
        return [
            {
                name: "user",
                description: "Show user's recent issues and prs",
                options: [
                    {
                        name: "username",
                        description: "Username to search Github with",
                        type: "STRING",
                        required: true,
                    },
                ],
            },
            {
                name: "username",
                type: "MESSAGE",
            },
        ];
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const username = interaction.options.getString("username");
        if (username === null) {
            const message = await noMatchingFoundMessage(interaction);
            interaction.editReply(message);
            return;
        }
        const response = await githubAPI.fetchUserIssuesAndPulls(username);
        if (response.issues.length === 0 && response.pulls.length === 0) {
            const message = await noMatchingFoundMessage(interaction);
            interaction.editReply(message);
            return;
        }
        const rows = [];
        const openIssueEmoji = (await getOpenIssue(interaction.client))?.toString() ?? "";
        const closedIssueEmoji = (await getClosedIssue(interaction.client))?.toString() ?? "";
        const openPullEmoji = (await getOpenPull(interaction.client))?.toString() ?? "";
        const mergedPullEmoji = (await getMergedPull(interaction.client))?.toString() ?? "";
        const closedPullEmoji = (await getClosedPull(interaction.client))?.toString() ?? "";
        if (response.issues.length > 0) {
            rows.push(
                new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId("issues")
                        .setPlaceholder("Issues")
                        .addOptions(
                            response.issues.map(issue => ({
                                label: issue.title,
                                description: "",
                                value: issue.number.toString(),
                                emoji: issue.state === "closed" ? closedIssueEmoji : openIssueEmoji,
                            }))
                        )
                )
            );
        }
        if (response.pulls.length > 0) {
            rows.push(
                new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId("pulls")
                        .setPlaceholder("Pull Requests")
                        .addOptions(
                            response.pulls.map(pull => {
                                let emoji = openPullEmoji;
                                const isMerged = pull?.pull_request?.merged_at !== null;
                                if (isMerged) {
                                    emoji = mergedPullEmoji;
                                } else if (pull.state === "closed") {
                                    emoji = closedPullEmoji;
                                }
                                return {
                                    label: pull.title,
                                    description: "",
                                    value: pull.number.toString(),
                                    emoji: emoji,
                                };
                            })
                        )
                )
            );
        }
        if (rows.length === 0) return;
        const embed = new MessageEmbed()
            .setColor(GitHubColor.Open)
            .setTitle(
                `Select a Pull Request or Issue to display from ${username}'s recent github activity.`
            );
        await interaction.editReply({ embeds: [embed], components: rows });
    }

    override async handleSelectMenu(interaction: SelectMenuInteraction): Promise<void> {
        const newEmbed = await embedFromIssueOrPull(
            await githubAPI.getIssueOrPull(parseInt(interaction.values[0]))
        );
        if (newEmbed) interaction.update({ embeds: [newEmbed], components: [] });
    }
}
