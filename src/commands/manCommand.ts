/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    CommandInteraction,
    Interaction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} from "discord.js";
import githubAPI from "../apis/githubAPI";
import { getMaximize, getMinimize, getSadCaret } from "../util/emoji";
import Command from "./command";

interface Paragraph {
    title?: string;
    content: string;
    truncateFollowingLines?: boolean;
}

export class ManCommand extends Command {
    override data(): ApplicationCommandData | ApplicationCommandData[] {
        return {
            name: "man",
            description: "Display a SerenityOS man page",
            options: [
                {
                    name: "section",
                    type: "INTEGER",
                    description: "The section in which the page to display is",
                    required: true,
                },
                {
                    name: "page",
                    type: "STRING",
                    description: "The name of the page to display",
                    required: true,
                },
            ],
        };
    }

    override async run(interaction: CommandInteraction): Promise<void> {
        const section = interaction.options.getInteger("section", true).toString();
        const page = interaction.options.getString("page", true);

        const result = await githubAPI.fetchSerenityManpage(section, page);

        if (result) {
            const { markdown, url } = result;

            await interaction.reply({
                fetchReply: true,
                embeds: [ManCommand.embedForMan(markdown, url, section, page, true)],
                components: [await ManCommand.buttons(interaction)],
            });
        } else {
            const sadcaret = await getSadCaret(interaction);

            await interaction.reply({
                ephemeral: true,
                content: `No matching man page found for ${page}(${section}) ${sadcaret ?? ":^("}`,
            });
        }
    }

    static async buttons(interaction: Interaction): Promise<MessageActionRow> {
        const maximizeButton = new MessageButton()
            .setCustomId("maximize")
            .setLabel("Maximize")
            .setStyle("PRIMARY");

        const minimizeButton = new MessageButton()
            .setCustomId("minimize")
            .setLabel("Minimize")
            .setStyle("PRIMARY");

        const maximizeEmote = await getMaximize(interaction);
        const minimizeEmote = await getMinimize(interaction);

        if (maximizeEmote) maximizeButton.setEmoji(maximizeEmote.identifier);
        if (minimizeEmote) minimizeButton.setEmoji(minimizeEmote.identifier);

        return new MessageActionRow().addComponents(maximizeButton, minimizeButton);
    }

    static embedForMan(
        markdown: string,
        url: string,
        section: string,
        page: string,
        collapsed: boolean
    ): MessageEmbed {
        const paragraphs: Array<Paragraph> = new Array<Paragraph>();

        let currentParagraph: Paragraph = { content: "" };
        let truncated = false;
        let name: string | undefined;

        for (let line of markdown.split("\n")) {
            if (line.startsWith("## ")) {
                if (currentParagraph.content !== "") {
                    if (currentParagraph.title === "Name") {
                        name = currentParagraph.content;
                    } else {
                        paragraphs.push(currentParagraph);
                    }
                }

                currentParagraph = { content: "" };

                currentParagraph.title = line.substring(3).trim();
            } else if (!currentParagraph.truncateFollowingLines) {
                if (currentParagraph.content.length + line.length + 4 > (collapsed ? 512 : 1024)) {
                    currentParagraph.content += "\n...";
                    currentParagraph.truncateFollowingLines = true;
                    truncated = true;
                } else {
                    if (line.startsWith("```")) line = line.replace(/\*/g, "");

                    currentParagraph.content += line + "\n";
                }
            }
        }

        const embed = new MessageEmbed()
            .setTitle(`${page}(${section})`)
            .setDescription(name ?? "Name not found")
            .setURL(url)
            .setTimestamp();

        for (const paragraph of paragraphs)
            if ((!collapsed || paragraph.title === "Description") && paragraph.title)
                embed.addField(paragraph.title, paragraph.content);

        if (truncated && !collapsed)
            embed.setFooter(
                `The following paragraphs have been truncated: ${paragraphs
                    .filter(paragraph => paragraph.title && paragraph.truncateFollowingLines)
                    .map(paragraph => paragraph.title)
                    .join(", ")}`
            );

        if (collapsed) embed.setFooter("React with maximize to expand sections");

        return embed;
    }
}
