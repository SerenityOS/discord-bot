/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { MessageEmbed } from "discord.js";
import githubAPI from "../apis/githubAPI";
import { CommandParser } from "../models/commandParser";
import { getSadCaret } from "../util/emoji";
import Command from "./commandInterface";

interface Paragraph {
    title?: string;
    content: string;
    truncateFollowingLines?: boolean;
}

export class ManCommand implements Command {
    matchesName(commandName: string): boolean {
        return "man" == commandName || "manpage" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}man <section> <page>** to display SerenityOS man pages`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;
        if (args.length < 2) {
            await parsedUserCommand.send(`Error: Not enough arguments provided. Ex: !man 2 unveil`);
        } else {
            const section = args[0];
            const page = args[1];
            const { markdown, url } = await githubAPI.fetch_serenity_manpage(section, page);
            if (markdown) {
                await parsedUserCommand.send(
                    this.embedForMan(parsedUserCommand, markdown, url, page)
                );
            } else {
                const sadcaret = getSadCaret(parsedUserCommand.originalMessage);
                await parsedUserCommand.send(`No matching man page found ${sadcaret}`);
            }
        }
    }

    embedForMan(
        parsedUserCommand: CommandParser,
        markdown: string,
        url: string,
        page: string
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
                if (currentParagraph.content.length + line.length + 4 > 1024) {
                    currentParagraph.content += "\n...";
                    currentParagraph.truncateFollowingLines = true;
                    truncated = true;
                } else {
                    if (line.startsWith("```")) line = line.replace(/\*/g, "");

                    currentParagraph.content += line + "\n";
                }
            }
        }

        const embed = parsedUserCommand
            .embed()
            .setTitle(page)
            .setDescription(name ?? "Name not found")
            .setURL(url);

        for (const paragraph of paragraphs)
            if (paragraph.title) embed.addField(paragraph.title, paragraph.content);

        if (truncated)
            embed.setFooter(
                `The following paragraphs have been truncated: ${paragraphs
                    .filter(paragraph => paragraph.title ?? paragraph.truncateFollowingLines)
                    .map(paragraph => paragraph.title)
                    .join(", ")}`
            );

        return embed;
    }
}
