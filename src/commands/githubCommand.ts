/*
 * Copyright (c) 2021-2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandOptionData,
    ChatInputApplicationCommandData,
    CommandInteraction,
    TextChannel,
} from "discord.js";
import githubAPI, { Repository, SERENITY_REPOSITORY } from "../apis/githubAPI";
import { embedFromIssueOrPull } from "../util/embedFromIssueOrPull";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

const repositories: Array<{
    name: string;
    urlRegex: RegExp;
    repository: Repository;
    defaultCategories?: Array<string>;
    defaultChannels?: Array<string>;
}> = [
    {
        name: "serenity",
        repository: SERENITY_REPOSITORY,
        urlRegex: /.+github.com\/SerenityOS\/serenity\/(?:issues|pull)\/(\d+).*/,
        defaultCategories: [
            // DEVELOPMENT
            "830526756619288616",

            // SUPPORT
            "836187014617104394",
        ],
    },
    {
        name: "jakt",
        repository: {
            owner: "SerenityOS",
            name: "jakt",
        },
        urlRegex: /.+github.com\/SerenityOS\/jakt\/(?:issues|pull)\/(\d+).*/,
        defaultCategories: [
            // JAKT
            "976984132376744027",
        ],
    },
];

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
            {
                name: "repository",
                description: "The repository to query in",
                type: "STRING",
                choices: Object.values(repositories).map(({ name }) => ({ name, value: name })),
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
        const url = interaction.options.getString("url");
        const repositoryName = interaction.options.getString("repository");
        const number = interaction.options.getNumber("number");
        const query = interaction.options.getString("query");

        // When a url was specified, try all known regexes to find the referenced repository and issue / pull id
        if (url) {
            for (const { repository, urlRegex } of repositories) {
                const matches = url.match(urlRegex);

                if (matches !== null) {
                    const number = parseInt(matches[1]);
                    const result = await embedFromIssueOrPull(
                        await githubAPI.getIssueOrPull(number, repository)
                    );

                    if (result) return await interaction.reply({ embeds: [result] });
                }
            }
        }

        let repository: Repository | undefined;

        // If a repository name was provided explicitly, find the repository associated with it
        if (repositoryName !== null) {
            repository = repositories.find(
                repository => repository.name === repositoryName
            )?.repository;
        }

        // If no repository name was provided, try to use the channel to infer a repository
        if (repository === undefined) {
            const channelId = interaction.channel?.id;

            if (channelId) {
                const findByChannelId = repositories.find(repository =>
                    repository.defaultChannels?.includes(channelId)
                );

                if (findByChannelId) repository = findByChannelId.repository;
            }
        }

        // If the repository could not be inferred by channel, try to infer by category
        if (repository === undefined) {
            const categoryId = await interaction.channel
                ?.fetch()
                .then(channel => (channel instanceof TextChannel ? channel.parentId : undefined));

            if (categoryId) {
                const findByCategoryId = repositories.find(repository =>
                    repository.defaultCategories?.includes(categoryId)
                );

                if (findByCategoryId) repository = findByCategoryId.repository;
            }
        }

        // Fall back to the serenity repository
        repository ??= SERENITY_REPOSITORY;

        if (number !== null) {
            const result = await embedFromIssueOrPull(
                await githubAPI.getIssueOrPull(number, repository)
            );

            if (result) return await interaction.reply({ embeds: [result] });
        }

        if (query) {
            const result = await embedFromIssueOrPull(
                await githubAPI.searchIssuesOrPulls(query, repository)
            );

            if (result) return await interaction.reply({ embeds: [result] });
        }

        const sadcaret = await getSadCaret(interaction);

        await interaction.reply({
            content: `No matching issues or pull requests found ${sadcaret ?? ":^("}`,
            ephemeral: true,
        });
    }
}
