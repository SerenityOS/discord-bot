/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Discord, { Message, MessageEmbed, MessageReaction, PartialUser, User } from "discord.js";
import githubAPI from "./apis/githubAPI";
import CommandHandler from "./commandHandler";
import { ManCommand } from "./commands";
import config from "./config/botConfig";
import { DISCORD_TOKEN } from "./config/secrets";
import { getMaximize, getMinimize } from "./util/emoji";

const client = new Discord.Client({ partials: ["MESSAGE", "CHANNEL", "REACTION"] });

const commandHandler = new CommandHandler(config.prefix, config.production);

client.on("ready", () => {
    if (client.user) {
        console.log(`Logged in as ${client.user.tag}.`);
        client.user.setPresence({
            status: "online",
            activity: {
                type: "PLAYING",
                name: "Type !help to list commands.",
            },
        });
    }
});
client.on("message", (message: Message) => {
    commandHandler.handleMessage(message);
});
client.on("messageReactionAdd", async (reaction: MessageReaction, user: User | PartialUser) => {
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

        if (!result) return;

        const { markdown, url, page, section } = result;

        message.edit(ManCommand.embedForMan(markdown, url, section, page, collapsed));

        reaction.users.remove(user.id);
    }
});
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
