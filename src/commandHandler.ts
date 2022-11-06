/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    BaseCommandInteraction,
    ButtonInteraction,
    Client,
    SelectMenuInteraction,
} from "discord.js";
import {
    CommitStatsCommand,
    EmojiCommand,
    GithubCommand,
    LogCommand,
    ManCommand,
    PlanCommand,
    QuickLinksCommand,
    QuoteCommand,
    Test262Command,
    UserCommand,
} from "./commands";

import Command from "./commands/command";
import { GUILD_ID } from "./config/secrets";
import config from "./config/botConfig";
import logger from "./util/logger";

export default class CommandHandler {
    private readonly commands: Map<string[], Command>;
    private readonly help: string;

    constructor() {
        const commandClasses = [
            CommitStatsCommand,
            ManCommand,
            PlanCommand,
            GithubCommand,
            QuickLinksCommand,
            Test262Command,
            EmojiCommand,
            QuoteCommand,
            UserCommand,
            LogCommand,
        ];

        const availableCommands = new Array<string>();

        this.commands = new Map(
            commandClasses.map(commandClass => {
                const command = new commandClass();
                const data = command.data();

                const dataArray = Array.isArray(data) ? data : [data];

                for (const entry of dataArray)
                    if (!entry.type || entry.type === "CHAT_INPUT")
                        availableCommands.push(`**${entry.name}** - ${entry.description}`);

                return [dataArray.map(entry => entry.name), command];
            })
        );

        this.help = "Available commands:\n" + availableCommands.join("\n");
    }

    async registerInteractions(client: Client): Promise<void> {
        const commands = [
            ...Array.from(this.commands.values())
                .map(command => command.data())
                .flat(),
            {
                name: "help",
                description: "List all available commands",
            },
        ];

        if (!config.production && GUILD_ID) {
            const guild = await client.guilds.fetch(GUILD_ID);

            guild.commands.set(commands);
        }

        if (!client.application) return;

        await client.application.commands.set(commands);
    }

    /** Executes user commands contained in a message if appropriate. */
    async handleBaseCommandInteraction(interaction: BaseCommandInteraction): Promise<void> {
        if (interaction.commandName === "help") {
            return await interaction.reply({
                ephemeral: true,
                content: this.help,
            });
        }

        let matchedCommand;

        for (const [names, command] of this.commands.entries()) {
            for (const name of names) {
                if (name.toLowerCase() === interaction.commandName) {
                    matchedCommand = command;
                    break;
                }
            }
        }

        if (!matchedCommand)
            return await interaction.reply({
                ephemeral: true,
                content: "I don't recognize that command.",
            });

        if (interaction.isCommand()) {
            logger.silly(
                `${interaction.user.tag} is executing ${interaction.commandName}`,
                interaction.options
            );
            return this.callInteractionHandler(
                matchedCommand,
                matchedCommand.handleCommand,
                interaction
            );
        }

        if (interaction.isContextMenu() && matchedCommand.handleContextMenu)
            return this.callInteractionHandler(
                matchedCommand,
                matchedCommand.handleContextMenu,
                interaction
            );
    }

    async handleSelectInteraction(interaction: SelectMenuInteraction): Promise<void> {
        let matchedCommand;

        for (const [names, command] of this.commands.entries()) {
            for (const name of names) {
                const cachedInteraction = interaction as SelectMenuInteraction<"cached">;
                if (name.toLowerCase() === cachedInteraction.message.interaction?.commandName) {
                    matchedCommand = command;
                    break;
                }
            }
        }

        if (!matchedCommand)
            return await interaction.reply({
                ephemeral: true,
                content: "I don't recognize that command.",
            });

        if (matchedCommand.handleSelectMenu)
            return this.callInteractionHandler(
                matchedCommand,
                matchedCommand.handleSelectMenu,
                interaction
            );
    }

    async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
        for (const [, command] of this.commands.entries()) {
            if (!command.buttonData) continue;

            for (const button of command.buttonData()) {
                if (button === interaction.customId) {
                    if (!command.handleButton)
                        throw new Error(
                            `${command.constructor.name}: handleButton has to be implemented if buttonData lists customId`
                        );

                    return this.callInteractionHandler(command, command.handleButton, interaction);
                }
            }
        }
    }

    private async callInteractionHandler<T>(
        command: Command,
        handler: (interaction: T) => Promise<void>,
        interaction: T & { reply: BaseCommandInteraction["reply"] }
    ): Promise<void> {
        await handler.call(command, interaction).catch(error => {
            logger.trace(error);
            interaction.reply({ ephemeral: true, content: `Failed because of ${error}` });
        });
    }
}
