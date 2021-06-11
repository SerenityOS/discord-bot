/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Message, MessageEmbed } from "discord.js";
import githubAPI from "../apis/githubAPI";
import { CommandParser } from "../models/commandParser";
import { getMaximize, getMinimize, getSadCaret } from "../util/emoji";
import Command from "./commandInterface";

interface Paragraph {
    title?: string;
    content: string;
    truncateFollowingLines?: boolean;
}

export class ManCommand implements Command {
    private readonly pageRegex = /(.*)\((\d)\)/;

    matchesName(commandName: string): boolean {
        return "man" == commandName || "manpage" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}man [ <section> <page> | page(section) ]** to display SerenityOS man pages`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;

        let section: string;
        let page: string;

        if (args.length < 1) {
            await parsedUserCommand.send("Error: At least one argument required");
            return;
        }

        const pageRegexMatch = args[0].match(this.pageRegex);

        if (pageRegexMatch) {
            section = pageRegexMatch[2];
            page = pageRegexMatch[1];
        } else if (args.length < 2) {
            await parsedUserCommand.send("Error: At least two arguments required");
            return;
        } else {
            section = args[0];
            page = args[1];
        }

        const result = await githubAPI.fetchSerenityManpage(section, page);

        if (result) {
            const { markdown, url } = result;
            const message: Message = await parsedUserCommand.send(
                ManCommand.embedForMan(markdown, url, section, page, true)
            );
            const maximizeEmote = await getMaximize(message);
            const minimizeEmote = await getMinimize(message);

            if (maximizeEmote != null) message.react(maximizeEmote.identifier);
            if (minimizeEmote != null) message.react(minimizeEmote.identifier);
        } else {
            const sadcaret = await getSadCaret(parsedUserCommand.originalMessage);
            await parsedUserCommand.send(
                `No matching man page found for ${page}(${section}) ${sadcaret ?? ":^("}`
            );
        }
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
