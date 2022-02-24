/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Discord, { Intents, Interaction } from "discord.js";
import CommandHandler from "./commandHandler";
import config from "./config/botConfig";
import { DISCORD_TOKEN } from "./config/secrets";

const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

const commandHandler = new CommandHandler(config.production);

client.on("ready", () => {
    if (client.user != null) {
        console.log(`Logged in as ${client.user.tag}.`);
        client.user.setPresence({
            status: "online",
            activities: [
                {
                    type: "PLAYING",
                    name: "Type /help to list commands.",
                },
            ],
        });

        commandHandler.registerInteractions(client);
    }
});
client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.user.bot) return;

    if (interaction.isCommand() || interaction.isContextMenu())
        commandHandler.handleBaseCommandInteraction(interaction);

    if (interaction.isButton()) commandHandler.handleButtonInteraction(interaction);

    if (interaction.isSelectMenu()) commandHandler.handleSelectInteraction(interaction);
});
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
