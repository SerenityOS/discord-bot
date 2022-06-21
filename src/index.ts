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
client.on("messageCreate", async message => {
    try {
        if (message.author.bot) {
            console.log(
                `messageCreate: Message ${message.id} has been authored by a bot, returning`
            );
            return;
        }

        await message.fetch();

        console.log(`messageCreate: Message ${message.id} has ${message.embeds.length} embeds`);

        for (const embed of message.embeds) {
            if (!embed.url) {
                console.log(
                    `messageCreate: Message ${message.id} has embed without url, trying the next embed`
                );
                continue;
            }

            const url = new URL(embed.url);
            if (url.host !== "github.com") {
                console.log(
                    `messageCreate: Message ${message.id} has embed with non github.com host '${embed.url}', trying the next embed`
                );
                continue;
            }

            // eg.: embed.url: "https://github.com/SerenityOS/serenity/blob/master/AK/AllOf.h"
            //      url.pathname: "/SerenityOS/serenity/blob/master/AK/AllOf.h"
            //      segments: ["", "SerenityOS", "serenity", "blob", "master", "AK", "AllOf.h"]
            //      githubUrlType: "blob"
            const segments = url.pathname.split("/");
            const githubUrlType: string | undefined = segments[3];

            console.log(
                `messageCreate: Message ${message.id} has github embed with type '${githubUrlType}'`
            );

            if (githubUrlType === "tree" || githubUrlType === "blob") {
                await message.suppressEmbeds();
                console.log(`messageCreate: Message ${message.id}'s embeds were suppressed`);
                return;
            }
        }
    } catch (e) {
        console.log("messageCreate: A runtime error occurred in the event handler:", e);
    }
});

client.login(DISCORD_TOKEN);
