/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Discord, { Message } from "discord.js";
import { DISCORD_TOKEN } from "./config/secrets";
import CommandHandler from "./commandHandler";
import config from "./config/botConfig";

const client = new Discord.Client();

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
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
