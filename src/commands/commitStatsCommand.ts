/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandOptionData,
    ChatInputApplicationCommandData,
    CommandInteraction,
} from "discord.js";
import githubAPI, { Commit, Repository } from "../apis/githubAPI";
import Command from "./command";

export class CommitStatsCommand extends Command {
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        const description = "Show user's total amount of commits";
        const options: ApplicationCommandOptionData[] = [
            {
                name: "author",
                description: "Username or email of the commit author",
                type: "STRING",
                required: true,
            },
            {
                name: "silent",
                type: "BOOLEAN",
                description: "Set this to `false` to broadcast the output",
                required: false,
            },
        ];

        return [
            {
                name: "commit-stats",
                description,
                options,
            },
        ];
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const author = interaction.options.getString("author");
        if (!author) return;

        const silent =
            interaction.options.getBoolean("silent") !== null
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
            const userCommits = (
                await Promise.all(
                    repos.map<Promise<RepoInfo>>(async repo => ({
                        repo,
                        commits:
                            (
                                await githubAPI.searchCommit(
                                    undefined,
                                    `author:${user.login}`,
                                    repo
                                )
                            )?.items ?? [],
                        totalCount: await githubAPI.getCommitsCount(user.login ?? author, repo),
                    }))
                )
            ).sort((a, b) => (b.totalCount ?? 0) - (a.totalCount ?? 0));

            const totalCommits = userCommits.reduce(
                (n, { totalCount }) => (totalCount ?? 0) + n,
                0
            );

            if (totalCommits <= 0) {
                await interaction.editReply({
                    content: `Couldn't find any contributions from ${user.login} :^(`,
                });
                return;
            }

            const formatSection = (item: RepoInfo): string[] | null => {
                const { repo, commits, totalCount } = item;

                if (!totalCount || totalCount <= 0) {
                    return null;
                }
                const { owner, name } = repo;

                const content = [
                    `**[${owner}/${name}](<https://github.com/${owner}/${name}>)** - **${
                        totalCount ?? "unknown"
                    } commits**`,
                ];

                for (let i = 0; i < commits.length && i < 3; i++) {
                    const { commit, html_url: url, sha } = commits[i];
                    content.push(
                        `    - ${commit.message.split("\n")[0]} ([${sha.slice(0, 7)}](${url})).`
                    );
                }

                // If we failed to load the actual commit data
                if (commits.length <= 0) {
                    content.push(`    - \`Commits failed to load\``);
                }

                if (totalCount > 3) {
                    content.push(
                        `    - [*View All...*](<https://github.com/${owner}/${name}/commits?author=${user.login}>)`
                    );
                }

                return [content.join("\n"), ""];
            };

            const header = `**__[${user.login}](<${
                user.html_url
            }>)__ has landed a total of ${totalCommits} commit${
                totalCommits == 1 ? "" : "s"
            } across the SerenityOS project <:catdog:1037719954214092840>**\n`;

            const content = userCommits.map(formatSection).filter(i => i);

            const blocks = [[header], ...content].flat();
            const complete = blocks.join("\n");

            // Discord messages currently have a hard limit
            // on 2000 characters per message. even for bots.
            // The following is to kind of hack around that.
            if (complete.length <= 2000) {
                await interaction.editReply({
                    content: complete,
                });
                return;
            }

            // If we need to split up the content into multiple
            // messages they'll all have the initial reply as the
            // parent. So let's keep it short, sweet and to the point.
            await interaction.editReply({
                content: blocks.shift(),
            });

            const messages: string[] = [];
            let message = "";

            // The most stupidly simple way to split up a list
            // of string into max 2000 characters long messages.
            // FIXME: Turn this into a utility function?
            for (let i = 0; i < blocks.length; i++) {
                const line = blocks[i];

                if ((message + line + "\n").length > 2000) {
                    messages.push(message);
                    message = "";
                }

                message += line + "\n";
            }
            if (message != "") messages.push(message);

            for (let i = 0; i < messages.length; i++) {
                const content = messages[i];

                await interaction.followUp({
                    ephemeral: silent,
                    content,
                });
            }
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
