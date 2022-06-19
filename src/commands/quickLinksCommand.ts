/*
 * Copyright (c) 2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import Command from "./command";
import { SERENITY_REPOSITORY } from "../apis/githubAPI";

export class QuickLinksCommand extends Command {
    private readonly repository: string = `https://github.com/${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}/blob/master`;
    private readonly manpages: string = `${this.repository}/Base/usr/share/man`;

    readonly links: { help: string; response: string; name: string }[] = [
        {
            name: "botsrc",
            response:
                "Bot Source: <https://github.com/SerenityOS/discord-bot/tree/master/src/commands>",
            help: "Get a link to the source code for bot commands",
        },
        {
            name: "build",
            response: `How To Build: <${this.manpages}/man9/BuildInstructions.md>`,
            help: "Get a link to the build docs",
        },
        {
            name: "clion",
            response: `Configuring the CLion IDE: <${this.manpages}/man9/CLionConfiguration.md>`,
            help: "Get a link to the directions for configuring the CLion IDE",
        },
        {
            name: "emacs",
            response: `Configuring Emacs: <${this.manpages}/man9/EmacsConfiguration.md>`,
            help: "Get a link to the directions for configuring Emacs",
        },
        {
            name: "faq",
            response: `FAQ: <${this.repository}/FAQ.md>`,
            help: "Get a link to the SerenityOS FAQ",
        },
        {
            name: "git-rewrite",
            response: "https://youtu.be/ElRzTuYln0M",
            help: "Get a link to a video explaining how to rewrite git history",
        },
        {
            name: "hardware",
            response: `Hardware Compatibility: <${this.manpages}/man9/HardwareCompatibility.md>`,
            help: "Get a link to the hardware compatibility list",
        },
        {
            name: "install",
            response: `Installing on real hardware: <${this.manpages}/man9/BareMetalInstallation.md>`,
            help: "Get a link to the directions for installing SerenityOS on real hardware",
        },
        {
            name: "iso",
            response: `There are no ISO images. This project does not cater to non-technical users.\nSee the FAQ: <${this.repository}/FAQ.md>`,
            help: "Respond with the iso image policy + FAQ link",
        },
        {
            name: "qtcreator",
            response: `Configuring the QT Creator IDE: <${this.manpages}/man9/UsingQtCreator.md>`,
            help: "Get a link to the directions for configuring the QT Creator IDE",
        },
        {
            name: "soytineres",
            response:
                "https://cdn.discordapp.com/attachments/830525235803586570/843838343905411142/IMG_20210517_170429.png",
            help: "!SOytinereS ot emocleW",
        },
        {
            name: "vscode",
            response: `Configuring the Visual Studio Code IDE: <${this.manpages}/man9/VSCodeConfiguration.md>`,
            help: "Get a link to the directions for configuring the Visual Studio Code IDE",
        },
        {
            name: "whf",
            response:
                "WHF is short for 'Well hello friends', the greeting used by Andreas in his coding videos",
            help: "Explains the meaning of 'whf'",
        },
        {
            name: "wsl",
            response: `WSL Specific Notes: <${this.manpages}/man9/BuildInstructionsWindows.md>`,
            help: "Get a link to the wsl specific notes",
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
