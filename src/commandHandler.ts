/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { BaseCommandInteraction, Client } from "discord.js";
import {
    EmojiCommand,
    GithubCommand,
    ManCommand,
    PlanCommand,
    QuickLinksCommand,
    QuoteCommand,
    Test262Command,
} from "./commands";
import Command from "./commands/command";
import config from "./config/botConfig";
import { GUILD_ID } from "./config/secrets";

export default class CommandHandler {
    private readonly commands: Map<string[], Command>;
    private readonly help: string;

    constructor(private readonly production: boolean) {
        const commandClasses = [
            ManCommand,
            PlanCommand,
            GithubCommand,
            QuickLinksCommand,
            Test262Command,
            EmojiCommand,
            QuoteCommand,
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
    async handleInteraction(interaction: BaseCommandInteraction): Promise<void> {
        if (interaction.user.bot) return;

        if (!this.production) {
            const msg = `Buggie bot received '${JSON.stringify(interaction)}' from ${
                interaction.user.tag
            }`;
            await interaction.channel?.send(msg);
            await console.log(msg);
        }

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
                content: "I don't recognize that command. Try **!help**.",
            });

        await matchedCommand.run(interaction).catch(error => {
            interaction.reply({ ephemeral: true, content: `Failed because of ${error}` });
        });
    }
}
