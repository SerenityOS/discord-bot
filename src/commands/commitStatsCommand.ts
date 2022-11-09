/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import githubAPI, { Commit, Repository } from "../apis/githubAPI";
import { CommitClubColor, GitHubColor } from "../util/color";
import { toMedal } from "../util/emoji";
import { extractCopy, trimString } from "../util/text";
import Command from "./command";

export class CommitStatsCommand extends Command {
    override data() {
        return [
            new SlashCommandBuilder()
                .setName("commits")
                .setDescription("Show user's total amount of commits")
                .addStringOption(author =>
                    author
                        .setName("author")
                        .setDescription("Username or email of the commit author")
                        .setRequired(true)
                )
                .addBooleanOption(silent =>
                    silent
                        .setName("silent")
                        .setDescription("Set this to `false` to broadcast the output")
                        .setRequired(false)
                )
                .toJSON(),
        ];
    }

    override async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const author = interaction.options.getString("author", true);
        if (!author) return;

        const silent =
            interaction.options.getBoolean("silent", false) !== null
                ? (interaction.options.getBoolean("silent") as boolean)
                : true;

        interface RepoInfo {
            repo: Repository;
            commits: Commit[];
            totalCount?: number;
        }

        // FIXME: Don't try-catch everything; instead do it on a
        //        per - throwable function basis.
        try {
            const user = await githubAPI.getUser(author);
            if (!user) {
                await interaction.reply({
                    ephemeral: true,
                    content: `We looked everywhere; but we couldn't find \`${author}\` :^(`,
                });
                return;
            }

            await interaction.deferReply({ ephemeral: silent });
            const repos = await githubAPI.fetchSerenityRepos();

            // GitHub may return non-complete data for some people
            // when using either their username or their email (even
            // if it's connected as the primary one).
            //
            // So as a work-around we'll test both the email and the
            // username to figure out which one of them returns the
            // complete set of commits.
            //
            // https://support.github.com/ticket/personal/0/1867096
            const useEmail =
                ((await githubAPI.getCommitsCount(user.email ?? author)) ?? 0) >
                ((await githubAPI.getCommitsCount(user.login ?? author)) ?? 0);

            const userCommits = (
                await Promise.all(
                    repos.map<Promise<RepoInfo>>(async repo => {
                        const commits = await githubAPI.searchCommit(
                            undefined,
                            useEmail ? `author-email:${user.email}` : `author:${user.login}`,
                            repo
                        );

                        return {
                            repo,
                            commits: commits?.items ?? [],
                            totalCount: commits.total_count,
                        };
                    })
                )
            ).sort((a, b) => (b.totalCount ?? 0) - (a.totalCount ?? 0));

            const totalCommits = userCommits.reduce(
                (n, { totalCount }) => (totalCount ?? 0) + n,
                0
            );

            const name = `__${user.name ?? user.login}__`;
            const total = `**${totalCommits.toLocaleString("en-US")}** commit${
                totalCommits === 0 || totalCommits > 1 ? "s" : ""
            }`;

            const { title, description, color } = extractCopy(totalCommits, milestonesCopy);

            const card = new EmbedBuilder()
                .setTitle(
                    title({
                        name,
                        total,
                    })
                )
                .setDescription(
                    description?.({
                        name,
                        total,
                    }) || "\u200b"
                )
                .setColor((color?.({}) as ColorResolvable) || GitHubColor.Draft)
                .setThumbnail(user.avatar_url)
                .addFields(
                    ...userCommits
                        .slice(0, 3)
                        .filter(({ totalCount }) => totalCount! > 0)
                        .map(({ repo, commits, totalCount }, index) => ({
                            name: `${toMedal(index + 1)} **${repo.owner}/${
                                repo.name
                            }** - **${totalCount?.toLocaleString("en-US")} commit${
                                totalCount! > 1 ? "s" : ""
                            }**`,
                            value: [
                                ...commits
                                    .slice(0, 3)
                                    .map(
                                        ({ commit, sha, html_url: url }) =>
                                            `\u200b\u2001- ${trimString(
                                                commit.message.split("\n")[0],
                                                45
                                            )} ([${sha.slice(0, 7)}](${url})).`
                                    ),
                                commits.length > 3
                                    ? `\u200b\u2001- [**View All...**](<https://github.com/${repo.owner}/${repo.name}/commits?author=${user.login}>)`
                                    : null,
                            ]
                                .filter(a => a)
                                .join("\n"),
                        }))
                        .flat()
                )
                .setTimestamp()
                .setFooter({
                    text: "SerenityOS Contributor Statistics",
                    iconURL: "https://github.com/SerenityOS.png",
                });

            await interaction.editReply({
                embeds: [card],
            });
        } catch (e) {
            console.trace(e);
            await interaction.editReply({
                content: `Something went really wrong :^(\n\n\`\`\`${
                    (e as Error)?.stack ?? e ?? ""
                }\`\`\``,
            });
        }
    }
}

interface MilestonesContentCopy {
    [text: string]: (a: { [index: string]: string }) => string;
}

const milestonesCopy: Array<{
    min: number;
    max: number;
    copy: MilestonesContentCopy;
}> = [
    {
        min: Number.MIN_VALUE,
        max: 0,
        copy: {
            color: () => GitHubColor.Closed,
            title: ({ name }) => `${name} has not started contributing yet`,
            description: () =>
                [
                    "If you need some inspiration on where to start, you can always",
                    "[take a look at these issues](<https://github.com/SerenityOS/serenity/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22>).",
                ].join(" "),
        },
    },
    {
        min: 1,
        max: 24,
        copy: {
            color: () => GitHubColor.Draft,
            title: ({ name, total }) =>
                `A wild ${name} has appeared, and they've already got ${total} under their belt`,
        },
    },
    {
        min: 25,
        max: 49,
        copy: {
            color: () => GitHubColor.Open,
            title: ({ name, total }) =>
                `${name} has so far landed a total of ${total} across the SerenityOS project(s)`,
        },
    },
    {
        min: 50,
        max: 99,
        copy: {
            color: () => GitHubColor.Open,
            title: ({ name, total }) =>
                `${name} has crossed the halfway point on the road to triple digits with their ${total} contributed so far`,
        },
    },
    {
        min: 100,
        max: 499,
        copy: {
            color: () => CommitClubColor.OneHundred,
            title: ({ name, total }) =>
                `${name} is a "100 Commit Club" member with an unbelievable ${total} contributed as of right now`,
        },
    },
    {
        min: 500,
        max: 999,
        copy: {
            color: () => CommitClubColor.FiveHundred,
            title: ({ name, total }) =>
                `${name} is a "500 Commit Club" member with their ${total} contributed so far`,
        },
    },
    {
        min: 1000,
        max: 9999,
        copy: {
            color: () => CommitClubColor.OneThousand,
            title: ({ name, total }) =>
                `${name} is a "1000 Commit Club" member with a whopping ${total} contributed to SerenityOS`,
        },
    },
    {
        min: 10000,
        max: Number.MAX_VALUE,
        copy: {
            color: () => CommitClubColor.TenThousand,
            title: ({ name, total }) =>
                `${name} is a "10,000 Commit Club" member with an incredible ${total}`,
        },
    },
];
