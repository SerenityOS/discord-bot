/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    APIMessageContentResolvable,
    Client,
    Message,
    MessageAdditions,
    MessageOptions,
    MessageEmbed,
    MessageMentions,
} from "discord.js";

/** A user-given command extracted from a message. */
export class CommandParser {
    /** Command name in all lowercase. */
    readonly parsedCommandName: string;
    /** Arguments (split by space). */
    readonly args: string[];
    /** Original Message the command was extracted from. */
    readonly originalMessage: Message;

    readonly client: Client;

    readonly commandPrefix: string;

    constructor(client: Client, message: Message, prefix: string) {
        this.client = client;
        this.commandPrefix = prefix;
        const splitMessage = message.content
            .slice(prefix.length)
            .replace(MessageMentions.USERS_PATTERN, "")
            .trim()
            .split(/ +/g);
        const commandName = splitMessage.shift() || "";
        this.parsedCommandName = commandName.toLowerCase();
        this.args = splitMessage;
        this.originalMessage = message;
    }

    embed(): MessageEmbed {
        return new MessageEmbed()
            .setTimestamp()
            .setFooter(`Query by ${this.originalMessage.author.username}`);
    }

    async send(
        content:
            | APIMessageContentResolvable
            | (MessageOptions & { split?: false })
            | MessageAdditions
    ): Promise<Message> {
        return await this.originalMessage.channel.send(content);
    }
}
