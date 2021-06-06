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
                await parsedUserCommand.send(
                    new MessageEmbed().setDescription(
                        Array.from(Test262Command.statusIconByLabel)
                            .map(([key, icon]) => `${icon}: ${key}`)
                            .join("\n")
                    )
                );

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

    static statusIconByLabel = new Map<string, string | typeof getPoggie>([
        ["total", "🧪"],
        ["passed", getPoggie],
        ["failed", "🦬"],
        ["skipped", getBuggiemagnify],
        ["metadata_error", getBuggus],
        ["harness_error", getYakslice],
        ["timeout_error", getSkeleyak],
        ["process_error", getYaksplode],
        ["runner_exception", getNeoyak],
    ]);

    static repositoryUrlByName = new Map<string, string>([
        ["serenity", "https://github.com/SerenityOS/serenity/"],
        ["libjs-test262", "https://github.com/linusg/libjs-test262/"],
        ["test262", "https://github.com/tc39/test262/"],
        ["test262-parser-tests", "https://github.com/tc39/test262-parser-tests/"],
    ]);

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
            const percentage = test.results.passed / (test.results.total / 100);

            const fields = new Array<string>();

            for (const [label, value] of Object.entries(test.results)) {
                const previous = previousResult?.tests[name]?.results[label];
                let icon = Test262Command.statusIconByLabel.get(label) ?? label;

                if (typeof icon === "function") icon = (await icon(client))?.toString() ?? label;

                if (previous && previous - value !== 0) {
                    const difference = value - previous;

                    fields.push(`${icon} ${value} (${difference > 0 ? "+" : ""}${difference})`);

                    continue;
                }

                fields.push(`${icon} ${value}`);
            }

            embed.addField(
                `${name} (${percentage.toFixed(2)}%, ${test.duration.toFixed(2)}s)`,
                fields.join(" | "),
                false
            );
        }

        return embed;
    }
}
