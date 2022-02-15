/*
 * Copyright (c) 2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import Command from "./command";

export class QuickLinksCommand extends Command {
    private readonly documentation: string =
        "https://github.com/SerenityOS/serenity/blob/master/Documentation";

    readonly links: { help: string; response: string; name: string }[] = [
        {
            name: "faq",
            response: `FAQ: <${this.documentation}/FAQ.md>`,
            help: "Get a link to the SerenityOS FAQ",
        },
        {
            name: "build",
            response: `How To Build: <${this.documentation}/BuildInstructions.md>`,
            help: "Get a link to the build docs",
        },
        {
            name: "wsl",
            response: `WSL Specific Notes: <${this.documentation}/BuildInstructionsWindows.md>`,
            help: "Get a link to the wsl specific notes",
        },
        {
            name: "hardware",
            response: `Hardware Compatibility: <${this.documentation}/HardwareCompatibility.md>`,
            help: "Get a link to the hardware compatibility list",
        },
        {
            name: "install",
            response: `Installing on real hardware: <${this.documentation}/BareMetalInstallation.md>`,
            help: "Get a link to the directions for installing SerenityOS on real hardware",
        },
        {
            name: "iso",
            response: `There are no ISO images. This project does not cater to non-technical users.\nSee the FAQ: <${this.documentation}/FAQ.md>`,
            help: "Respond with the iso image policy + FAQ link",
        },
        {
            name: "botsrc",
            response:
                "Bot Source: <https://github.com/SerenityOS/discord-bot/tree/master/src/commands>",
            help: "Get a link to the source code for bot commands",
        },
        {
            name: "soytineres",
            response:
                "https://cdn.discordapp.com/attachments/830525235803586570/843838343905411142/IMG_20210517_170429.png",
            help: "!SOytinereS ot emocleW",
        },
        {
            name: "clion",
            response: `Configuring the CLion IDE: <${this.documentation}/CLionConfiguration.md>`,
            help: "Get a link to the directions for configuring the CLion IDE",
        },
        {
            name: "qtcreator",
            response: `Configuring the QT Creator IDE: <${this.documentation}/UsingQtCreator.md>`,
            help: "Get a link to the directions for configuring the QT Creator IDE",
        },
        {
            name: "vscode",
            response: `Configuring the Visual Studio Code IDE: <${this.documentation}/VSCodeConfiguration.md>`,
            help: "Get a link to the directions for configuring the Visual Studio Code IDE",
        },
        {
            name: "git-rewrite",
            response: "https://youtu.be/ElRzTuYln0M",
            help: "Get a link to a video explaining how to rewrite git history",
        },
    ];

    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        return this.links.map(link => ({
            name: link.name,
            description: link.help,
        }));
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        for (const link of this.links)
            if (link.name === interaction.commandName)
                return interaction.reply({ content: link.response });
    }
}
