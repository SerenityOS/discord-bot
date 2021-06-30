/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import assert from "assert";

export class QuickLinksCommand implements Command {
    private readonly documentation: string =
        "https://github.com/SerenityOS/serenity/blob/master/Documentation";

    readonly links: { help: string; response: string; name: string; suppressEmbeds: boolean }[] = [
        {
            name: "faq",
            response: `FAQ: ${this.documentation}/FAQ.md`,
            help: "get a link to the SerenityOS FAQ",
            suppressEmbeds: true,
        },
        {
            name: "build",
            response: `How To Build: ${this.documentation}/BuildInstructions.md`,
            help: "get a link to the build docs",
            suppressEmbeds: true,
        },
        {
            name: "wsl",
            response: `WSL Specific Notes: ${this.documentation}/NotesOnWSL.md`,
            help: "get a link to the wsl specific notes",
            suppressEmbeds: true,
        },
        {
            name: "hardware",
            response: `Hardware Compatability: ${this.documentation}/HardwareCompatibility.md`,
            help: "get a link to the hardware compatability list",
            suppressEmbeds: true,
        },
        {
            name: "install",
            response: `Installing on real hardware: ${this.documentation}/INSTALL.md`,
            help: "get a link to the directions for installing SerenityOS on real hardware",
            suppressEmbeds: true,
        },
        {
            name: "iso",
            response: `There are no ISO images. This project does not cater to non-technical users.\nSee the FAQ: ${this.documentation}/FAQ.md`,
            help: "Respond with the iso image policy + FAQ link",
            suppressEmbeds: true,
        },
        {
            name: "botsrc",
            response:
                "Bot Source: https://github.com/SerenityOS/discord-bot/tree/master/src/commands",
            help: "get a link to the source code for bot commands",
            suppressEmbeds: true,
        },
        {
            name: "soytineres",
            // The space at the end is needed.
            response:
                "https://cdn.discordapp.com/attachments/830525235803586570/843838343905411142/IMG_20210517_170429.png ",
            help: "!SOytinereS ot emocleW",
            suppressEmbeds: false,
        },
    ];

    matchesName(commandName: string): boolean {
        return this.links.some(link => link.name === commandName);
    }

    help(commandPrefix: string): string {
        return this.links
            .map(link => `Use **${commandPrefix}${link.name}** to ${link.help}.`)
            .join("\n");
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const link = this.links.find(link => link.name === parsedUserCommand.parsedCommandName);
        assert(link);
        const message = await parsedUserCommand.send(link.response);

        if (link.suppressEmbeds) {
            await message.suppressEmbeds();
        }
    }
}
