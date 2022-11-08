/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ButtonInteraction,
    ChatInputApplicationCommandData,
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
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
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

    override buttonData(): Array<string> {
        return ["/man:maximize", "/man:minimize"];
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        const section = interaction.options.getInteger("section", true).toString();
        const page = interaction.options.getString("page", true);

        const result = await githubAPI.fetchSerenityManpage(section, page);

        if (result) {
            const { markdown, url: githubUrl } = result;

            await interaction.reply({
                fetchReply: true,
                embeds: [ManCommand.embedForMan(markdown, githubUrl, section, page, true)],
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

    override async handleButton(interaction: ButtonInteraction): Promise<void> {
        if (!interaction.channel) return;

        const message = await interaction.channel.messages.fetch(interaction.message.id);

        if (interaction.user.id !== message.interaction?.user.id) {
            return interaction.reply({
                ephemeral: true,
                content: `Only ${message.interaction?.user.tag} can update this embed`,
            });
        }

        const collapsed: boolean = interaction.customId === "/man:minimize";

        if (message.embeds.length === 1) {
            const embed: MessageEmbed = message.embeds[0];

            if (!embed.description) return;

            const result = await githubAPI.fetchSerenityManpageByUrl(
                embed.description?.match(/\(([^)]+)\)/)![1]
            );

            if (result == null) return;

            const { markdown, url: githubUrl, page, section } = result;

            interaction.update({
                embeds: [ManCommand.embedForMan(markdown, githubUrl, section, page, collapsed)],
            });
        }
    }

    static async buttons(interaction: Interaction): Promise<MessageActionRow> {
        const maximizeButton = new MessageButton()
            .setCustomId("/man:maximize")
            .setLabel("Maximize")
            .setStyle("PRIMARY");

        const minimizeButton = new MessageButton()
            .setCustomId("/man:minimize")
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
        githubUrl: string,
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
                        name = currentParagraph.content.replace(/[\r\n]/g, "");
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

        const url = `https://man.serenityos.org/man${section}/${page}.html`;

        const embed = new MessageEmbed()
            .setTitle(`${page}(${section})`)
            .setDescription(
                `${
                    name ?? "Name not found"
                }\n\n[View on GitHub](${githubUrl}) - [View on man.serenityos.org](${url})`
            )
            .setURL(url)
            .setTimestamp();

        for (const paragraph of paragraphs)
            if ((!collapsed || paragraph.title === "Description") && paragraph.title)
                embed.addField(paragraph.title, paragraph.content);

        if (truncated && !collapsed)
            embed.setFooter({
                text: `The following paragraphs have been truncated: ${paragraphs
                    .filter(paragraph => paragraph.title && paragraph.truncateFollowingLines)
                    .map(paragraph => paragraph.title)
                    .join(", ")}`,
            });

        if (collapsed) embed.setFooter({ text: "React with maximize to expand sections" });

        return embed;
    }
}
