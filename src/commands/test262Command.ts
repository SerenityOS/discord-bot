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

        if (args.length === 1) {
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

            for (let i = 0; i < results.length; i++) {
                if (results[i].versions.serenity.startsWith(args[0])) {
                    result = results[i];
                    previousResult = results[i - 1];

                    break;
                }
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

        const embed = new MessageEmbed()
            .setTitle(commit?.message.split("\n")[0])
            .setDescription(
                Object.entries(result.versions)
                    .map(([repository, commit]) => {
                        const treeUrl = Test262Command.repositoryUrlByName.get(repository);
                        const shortCommit = commit.substring(0, 7);

                        if (treeUrl)
                            return `${repository}: [${shortCommit}](${treeUrl}tree/${commit})`;

                        return `${repository}: ${shortCommit}`;
                    })
                    .join("\n")
            )
            .setTimestamp(new Date(result.run_timestamp * 1000))
            .setFooter("Tests started");

        for (const [name, test] of Object.entries(result.tests)) {
            const previousTest = previousResult?.tests[name];

            const fields = new Array<string>();

            const percentage = test.results.passed / (test.results.total / 100);
            const previousPercentage = previousTest
                ? previousTest?.results.passed / (previousTest?.results.total / 100)
                : 0;
            const percentageDifference = percentage - previousPercentage;

            if (percentageDifference !== 0) {
                fields.push(
                    `${(await getLibjs(client))?.toString()} ${percentage.toFixed(2)}% (${
                        percentageDifference > 0 ? "+" : ""
                    }${percentageDifference.toFixed(2)}) `
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
