/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ApplicationCommandData, CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { LogLevel } from "../util/logger";
import logger from "../util/logger";
import Command from "./command";
import { PRIVILEGED_GROUP_IDS } from "../config/secrets";
import config from "../config/botConfig";

export class LogCommand extends Command {
    override data(): ApplicationCommandData | ApplicationCommandData[] {
        const command = new SlashCommandBuilder()
            .setName("log")
            .setDescription("Manage BuggieBot's logging")
            .addSubcommand(command =>
                command.setName("get").setDescription("Get the current logging value")
            )
            .addSubcommand(command =>
                command
                    .setName("set")
                    .setDescription("Temporarily set the logging level")
                    .addNumberOption(level =>
                        level
                            .setName("level")
                            .setDescription("The logging level")
                            .setRequired(true)
                            .setChoices(
                                ...Object.keys(LogLevel)
                                    .filter(v => isNaN(Number(v)))
                                    .map((level, index) => ({
                                        name: level,
                                        value: index,
                                    }))
                            )
                    )
            );

        return command.toJSON() as any;
    }

    private async noPermission(interaction: CommandInteraction): Promise<void> {
        return await interaction.reply({ ephemeral: true, content: "Insufficient permission" });
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const issuer = await interaction.guild?.members?.fetch(interaction.user);
        if (!issuer)
            return await interaction.reply({
                ephemeral: true,
                content: "Command only available on the SerenityOS Discord Server",
            });

        const isPrivileged = issuer.roles.cache.hasAny(...PRIVILEGED_GROUP_IDS);
        const subcommand: "get" | "set" = interaction.options.getSubcommand() as any;

        switch (subcommand) {
            case "get": {
                const modified = logger.level !== config.logLevel;

                await interaction.reply({
                    content: `The logging level is currently set to ${modified ? "**" : ""}\`${
                        LogLevel[logger.level]
                    }\`${modified ? " (modified)**" : ""}!`,
                });
                return;
            }
            case "set": {
                if (!isPrivileged) return await this.noPermission(interaction);

                const level = interaction.options.getNumber("level", true);
                const previous = logger.level;

                logger.setLevel(level);

                await interaction.reply({
                    content: `The logging level was successfully changed from \`${LogLevel[previous]}\` to \`${LogLevel[level]}\``,
                });
                return;
            }
            default: {
                await interaction.reply({
                    ephemeral: true,
                    content: "Invalid subcommand",
                });
                return;
            }
        }
    }
}
