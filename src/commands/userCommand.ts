/*
 * Copyright (c) 2022, U9G <git@u9g.dev>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SelectMenuBuilder,
    SelectMenuInteraction,
    SlashCommandBuilder,
} from "discord.js";
import { embedFromIssueOrPull, noMatchingFoundMessage } from "../util/embedFromIssueOrPull.js";
import githubAPI from "../apis/githubAPI.js";
import Command from "./command.js";
import {
    getClosedIssue,
    getClosedPull,
    getMergedPull,
    getOpenIssue,
    getOpenPull,
} from "../util/emoji.js";
import { trimString } from "../util/text.js";
import { GitHubColor } from "../util/color.js";

export class UserCommand extends Command {
    override data() {
        return [
            new SlashCommandBuilder()
                .setName("user")
                .setDescription("Show user's recent issues and PRs")
                .addStringOption(username =>
                    username
                        .setName("username")
                        .setDescription("Username to search Github with")
                        .setRequired(true)
                )
                .toJSON(),
        ];
    }

    override async handleCommand(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString("username", true);

        if (username === null) {
            const message = await noMatchingFoundMessage(interaction);
            await interaction.editReply(message);
            throw new Error(message.content);
        }

        const response = await githubAPI.fetchUserIssuesAndPulls(username).catch(() => null);
        if (!response || (response.issues.length === 0 && response.pulls.length === 0)) {
            const message = await noMatchingFoundMessage(interaction);
            await interaction.editReply(message);
            throw new Error(message.content);
        }

        const rows: ActionRowBuilder<SelectMenuBuilder>[] = [];
        const openIssueEmoji = (await getOpenIssue(interaction.client))?.toString();
        const closedIssueEmoji = (await getClosedIssue(interaction.client))?.toString();
        const openPullEmoji = (await getOpenPull(interaction.client))?.toString();
        const mergedPullEmoji = (await getMergedPull(interaction.client))?.toString();
        const closedPullEmoji = (await getClosedPull(interaction.client))?.toString();

        if (response.issues.length > 0)
            rows.push(
                new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
                        .setCustomId("issues")
                        .setPlaceholder("Issues")
                        .addOptions(
                            response.issues.map(issue => ({
                                label: trimString(issue.title),
                                value: issue.number.toString(),
                                emoji: issue.state === "closed" ? closedIssueEmoji : openIssueEmoji,
                            }))
                        )
                )
            );

        if (response.pulls.length > 0)
            rows.push(
                new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                    new SelectMenuBuilder()
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
                                    label: trimString(pull.title),
                                    value: pull.number.toString(),
                                    emoji: emoji,
                                };
                            })
                        )
                )
            );

        if (rows.length === 0) throw new Error("User has no recent issues or prs");
        const embed = new EmbedBuilder()
            .setColor(GitHubColor.Open)
            .setTitle(
                `Select a Pull Request or Issue to display from ${username}'s recent github activity.`
            );

        await interaction.editReply({
            embeds: [embed],
            components: rows,
        });
    }

    override async handleSelectMenu(interaction: SelectMenuInteraction) {
        const newEmbed = await embedFromIssueOrPull(
            await githubAPI.getIssueOrPull(parseInt(interaction.values[0]))
        );
        if (newEmbed) await interaction.update({ embeds: [newEmbed], components: [] });
    }
}
