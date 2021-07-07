/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client, MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import githubAPI from "../apis/githubAPI";
import { CommandParser } from "../models/commandParser";
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
} from "../util/emoji";
import Command from "./commandInterface";

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

export class Test262Command implements Command {
    matchesName(commandName: string): boolean {
        return "test262" === commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}test262 [ commitHash | "labels" ]** to display libjs test262 results`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const results: Array<Result> = await (
            await fetch("https://libjs.dev/test262/data/results.json")
        ).json();

        const args = parsedUserCommand.args;

        let result: Result = results[results.length - 1];
        let previousResult: Result = results[results.length - 2];

        if (args[0] !== undefined) {
            if (args[0] === "labels") {
                const lines = new Array<string>();

                console.log(result);

                for (const label in Object.values(result.tests)[0].results) {
                    lines.push(
                        `${await Test262Command.statusIconForLabel(
                            parsedUserCommand.originalMessage.client,
                            label
                        )}: ${label}`
                    );
                }

                await parsedUserCommand.send(new MessageEmbed().setDescription(lines.join("\n")));

                return;
            }

            let foundCommit = false;

            for (let i = 0; i < results.length; i++) {
                if (results[i].versions.serenity.startsWith(args[0])) {
                    result = results[i];
                    previousResult = results[i - 1];

                    foundCommit = true;

                    break;
                }
            }

            if (!foundCommit) {
                const sadcaret = await getSadCaret(parsedUserCommand.originalMessage);

                await parsedUserCommand.send(
                    parsedUserCommand
                        .embed()
                        .setTitle("Not found")
                        .setDescription(
                            `Could not find a commit that ran test262 matching '${args[0]}' ${
                                sadcaret ?? ":^("
                            }`
                        )
                );

                return;
            }
        }

        await parsedUserCommand.send(
            await Test262Command.embedForResult(
                parsedUserCommand.originalMessage.client,
                result,
                previousResult
            )
        );
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
            .setTitle(commit?.commit.message.split("\n")[0])
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
                const previousValue = previousTest?.results[label];
                const icon = await Test262Command.statusIconForLabel(client, label);

                if (previousValue && previousValue - value !== 0) {
                    const difference = value - previousValue;

                    fields.push(`${icon} ${value} (${difference > 0 ? "+" : ""}${difference})`);

                    continue;
                }

                fields.push(`${icon} ${value}`);
            }

            embed.addField(`${name} (${test.duration.toFixed(2)}s)`, fields.join(" | "), false);
        }

        return embed;
    }
}
