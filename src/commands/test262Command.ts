/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ChatInputApplicationCommandData,
    Client,
    CommandInteraction,
    MessageEmbed,
} from "discord.js";
import axios from "axios";
import githubAPI from "../apis/githubAPI";
import {
    getBuggiemagnify,
    getBuggus,
    getLibjs,
    getNeoyak,
    getPoggie,
    getSadCaret,
    getSkeleyak,
    getYakslice,
    getYaksplode,
    getYakstack,
} from "../util/emoji";
import Command from "./command";

/* eslint-disable camelcase */
interface Result {
    commit_timestamp: number;
    run_timestamp: number;
    versions: {
        serenity: string;
        "libjs-test262": string;
        test262: string;
        "test262-parser-tests": string;
    };
    tests: {
        [name: string]: {
            duration: number;
            results: {
                [label: string]: number;
            };
        };
    };
}
/* eslint-enable camelcase */

export class Test262Command extends Command {
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        return {
            name: "test262",
            description: "Display LibJS test262 results",
            options: [
                {
                    name: "commit",
                    description: "The commit to use the results from",
                    type: "STRING",
                },
                {
                    name: "labels",
                    description: "Print the meaning of label emojis",
                    type: "STRING",
                    choices: [
                        {
                            name: "labels",
                            value: "labels",
                        },
                    ],
                },
            ],
        };
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        const response = await axios.get<Result[]>("https://libjs.dev/test262/data/results.json");

        const results: Result[] = response.data;
        let result: Result = results[results.length - 1];
        let previousResult: Result = results[results.length - 2];

        if (interaction.options.getString("labels") === "labels") {
            const lines = new Array<string>();

            for (const label in Object.values(result.tests)[0].results) {
                lines.push(
                    `${await Test262Command.statusIconForLabel(
                        interaction.client,
                        label
                    )}: ${label}`
                );
            }

            return await interaction.reply({
                ephemeral: true,
                embeds: [new MessageEmbed().setDescription(lines.join("\n"))],
            });
        }

        const commit = interaction.options.getString("commit");

        if (commit) {
            let foundCommit = false;

            for (let i = 0; i < results.length; i++) {
                if (results[i].versions.serenity.startsWith(commit)) {
                    result = results[i];
                    previousResult = results[i - 1];

                    foundCommit = true;

                    break;
                }
            }

            if (!foundCommit) {
                const sadcaret = await getSadCaret(interaction);

                return await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        new MessageEmbed()
                            .setTitle("Not found")
                            .setDescription(
                                `Could not find a commit that ran test262 matching '${commit}' ${
                                    sadcaret ?? ":^("
                                }`
                            ),
                    ],
                });
            }
        }

        await interaction.reply({
            embeds: [
                await Test262Command.embedForResult(interaction.client, result, previousResult),
            ],
        });
    }

    static repositoryUrlByName = new Map<string, string>([
        ["serenity", "https://github.com/SerenityOS/serenity/"],
        ["libjs-test262", "https://github.com/linusg/libjs-test262/"],
        ["test262", "https://github.com/tc39/test262/"],
        ["test262-parser-tests", "https://github.com/tc39/test262-parser-tests/"],
    ]);

    static async statusIconForLabel(client: Client, label: string): Promise<string> {
        switch (label) {
            case "total":
                return "🧪";
            case "passed":
                return (await getPoggie(client))?.toString() ?? label;
            case "failed":
                return "🦬";
            case "skipped":
                return (await getBuggiemagnify(client))?.toString() ?? label;
            case "metadata_error":
                return (await getBuggus(client))?.toString() ?? label;
            case "harness_error":
                return (await getYakslice(client))?.toString() ?? label;
            case "timeout_error":
                return (await getSkeleyak(client))?.toString() ?? label;
            case "process_error":
                return (await getYaksplode(client))?.toString() ?? label;
            case "runner_exception":
                return (await getNeoyak(client))?.toString() ?? label;
            case "todo_error":
                return (await getYakstack(client))?.toString() ?? label;
            default:
                return label;
        }
    }

    static async embedForResult(
        client: Client,
        result: Result,
        previousResult?: Result
    ): Promise<MessageEmbed> {
        const commit = await githubAPI.searchCommit(result.versions.serenity);

        if (commit == null) {
            const sadcaret = await getSadCaret(client);

            return new MessageEmbed()
                .setTitle("Error")
                .setDescription(
                    `Could not fetch the matching commit ('${
                        result.versions.serenity
                    }') for the test262 run from github ${sadcaret ?? ":^("}`
                );
        }

        const description = Object.entries(result.versions)
            .map(([repository, commitHash]) => {
                const treeUrl = Test262Command.repositoryUrlByName.get(repository);
                const shortCommitHash = commitHash.substring(0, 7);

                if (treeUrl)
                    return `${repository}: [${shortCommitHash}](${treeUrl}tree/${commitHash})`;

                return `${repository}: ${shortCommitHash}`;
            })
            .join("\n");

        const embed = new MessageEmbed()
            .setAuthor({
                name: commit.author ? commit.author.login : commit.commit.author.name,
                url: commit.author?.html_url,
                iconURL: commit.author?.avatar_url,
            })
            .setTitle(commit.commit.message.split("\n")[0])
            .setDescription(description)
            .setTimestamp(new Date(result.run_timestamp * 1000))
            .setFooter("Tests started");

        for (const [name, test] of Object.entries(result.tests)) {
            const previousTest = previousResult?.tests[name];

            const fields = new Array<string>();

            const percentage = test.results.passed / (test.results.total / 100);
            const previousPercentage = previousTest
                ? previousTest?.results.passed / (previousTest?.results.total / 100)
                : 0;
            const percentageDifference = (percentage - previousPercentage).toFixed(2);

            if (percentageDifference !== "0.00" && percentageDifference !== "-0.00") {
                fields.push(
                    `${(await getLibjs(client))?.toString()} ${percentage.toFixed(2)}% (${
                        percentageDifference.startsWith("-") ? "" : "+"
                    }${percentageDifference}) `
                );
            } else {
                fields.push(`${(await getLibjs(client))?.toString()} ${percentage.toFixed(2)}%`);
            }

            for (const [label, value] of Object.entries(test.results)) {
                const previousValue = previousTest?.results[label] ?? 0;
                const icon = await Test262Command.statusIconForLabel(client, label);

                if (previousValue - value !== 0) {
                    const difference = value - previousValue;

                    fields.push(`${icon} ${value} (${difference > 0 ? "+" : ""}${difference})`);

                    continue;
                }

                fields.push(`${icon} ${value}`);
            }

            if (previousTest) {
                for (const [label, value] of Object.entries(previousTest.results).filter(
                    ([label]) => !(label in test.results)
                )) {
                    const icon = await Test262Command.statusIconForLabel(client, label);

                    fields.push(`${icon} 0 (-${value})`);
                }
            }

            embed.addField(`${name} (${test.duration.toFixed(2)}s)`, fields.join(" | "), false);
        }

        return embed;
    }
}
