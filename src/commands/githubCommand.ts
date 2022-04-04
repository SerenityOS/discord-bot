/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandOptionData,
    ChatInputApplicationCommandData,
    CommandInteraction,
} from "discord.js";
import githubAPI from "../apis/githubAPI";
import { embedFromIssueOrPull } from "../util/embedFromIssueOrPull";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

const URL_REGEX = /.+github.com\/SerenityOS\/serenity\/(?:issues|pull)\/(\d+).*/;

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
            {
                name: "url",
                description: "The full url to an issue or pull request",
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
        const url = interaction.options.getString("url");

        if (number !== null) {
            const result = await embedFromIssueOrPull(await githubAPI.getIssueOrPull(number));

            if (result) return await interaction.reply({ embeds: [result] });
        }

        if (url && URL_REGEX.test(url)) {
            const matches = url.match(URL_REGEX);
            if (matches !== null && matches[1]) {
                const number = parseInt(matches[1]);
                const result = await embedFromIssueOrPull(await githubAPI.getIssueOrPull(number));

                if (result) return await interaction.reply({ embeds: [result] });
            }
        }

        if (query) {
            const result = await embedFromIssueOrPull(await githubAPI.searchIssuesOrPulls(query));

            if (result) return await interaction.reply({ embeds: [result] });
        }

        const sadcaret = await getSadCaret(interaction);

        await interaction.reply({
            content: `No matching issues or pull requests found ${sadcaret ?? ":^("}`,
            ephemeral: true,
        });
    }
}
