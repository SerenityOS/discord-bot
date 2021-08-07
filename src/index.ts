/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Discord, { Intents, Interaction, Message, MessageEmbed } from "discord.js";
import githubAPI from "./apis/githubAPI";
import CommandHandler from "./commandHandler";
import { ManCommand } from "./commands";
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
    if (interaction.isButton()) {
        if (!interaction.channel) return;

        const message: Message = await interaction.channel.messages.fetch(interaction.message.id);

        if (interaction.user.id !== message.interaction?.user.id) return;

        const collapsed: boolean = interaction.customId === "minimize";

        if (message.embeds.length === 1) {
            const embed: MessageEmbed = message.embeds[0];

            if (!embed.url) return;

            const result = await githubAPI.fetchSerenityManpageByUrl(embed.url);

            if (result == null) return;

            const { markdown, url, page, section } = result;

            interaction.update({
                embeds: [ManCommand.embedForMan(markdown, url, section, page, collapsed)],
            });
        }

        return;
    }

    if (!interaction.isCommand()) return;

    commandHandler.handleInteraction(interaction);
});
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
