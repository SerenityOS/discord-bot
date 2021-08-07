/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Discord, {
    Intents,
    Interaction,
    Message,
    MessageEmbed,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    User,
} from "discord.js";
import githubAPI from "./apis/githubAPI";
import CommandHandler from "./commandHandler";
import { ManCommand } from "./commands";
import config from "./config/botConfig";
import { DISCORD_TOKEN } from "./config/secrets";
import { getMaximize, getMinimize } from "./util/emoji";

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
client.on("interactionCreate", (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    commandHandler.handleInteraction(interaction);
});
client.on(
    "messageReactionAdd",
    async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        const message: Message = await reaction.message.fetch();

        if (reaction.partial) reaction = await reaction.fetch();

        const collapsed: boolean | undefined =
            reaction.emoji === (await getMinimize(client))
                ? true
                : reaction.emoji === (await getMaximize(client))
                ? false
                : undefined;

        if (collapsed === undefined) return;

        if (user.id === client.user?.id) return;
        if (message.author.id !== client.user?.id) return;

        if (message.embeds.length === 1) {
            const embed: MessageEmbed = message.embeds[0];

            if (!embed.url) return;

            const result = await githubAPI.fetchSerenityManpageByUrl(embed.url);

            if (result == null) return;

            const { markdown, url, page, section } = result;
            const manEmbed = ManCommand.embedForMan(markdown, url, section, page, collapsed);
            message.edit({ embeds: [manEmbed] });

            if (message.channel.type !== "DM") reaction.users.remove(user.id);
        }
    }
);
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
