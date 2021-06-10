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

    readonly links: { help: string; response: string; name: string }[] = [
        {
            name: "faq",
            response: `FAQ: ${this.documentation}/FAQ.md`,
            help: "get a link to the SerenityOS FAQ",
        },
        {
            name: "build",
            response: `How To Build: ${this.documentation}/BuildInstructions.md`,
            help: "get a link to the build docs",
        },
        {
            name: "wsl",
            response: `WSL Specific Notes: ${this.documentation}/NotesOnWSL.md`,
            help: "get a link to the wsl specific notes",
        },
        {
            name: "install",
            response: `Installing on real hardware: ${this.documentation}/INSTALL.md`,
            help: "get a link to the directions for installing SerenityOS on real hardware",
        },
        {
            name: "bot-src",
            response:
                "Bot Source: https://github.com/SerenityOS/discord-bot/tree/master/src/commands",
            help: "get a link to the source code for bot commands",
        },
        {
            name: "soytineres",
            // The space at the end is needed.
            response:
                "https://cdn.discordapp.com/attachments/830525235803586570/843838343905411142/IMG_20210517_170429.png ",
            help: "!SOytinereS ot emocleW",
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
        await parsedUserCommand.send(link.response);
    }
}
