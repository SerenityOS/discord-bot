/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    BaseCommandInteraction,
    Client,
    ContextMenuInteraction,
    Guild,
    Message,
    MessageReference,
    User,
} from "discord.js";
import githubAPI, { SERENITY_REPOSITORY } from "../apis/githubAPI";
import { QUOTE_ROLE_ID } from "../config/secrets";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

export class QuoteCommand extends Command {
    private readonly messageLinkRegex: RegExp =
        /https:\/\/(?:(?:ptb|canary)\.)?discord\.com\/channels\/(?<guild>[0-9]{17,18})\/(?<channel>[0-9]{17,18})\/(?<message>[0-9]{17,18})/;

    override data(): ApplicationCommandData | ApplicationCommandData[] {
        return [
            {
                name: "quote",
                description: "Quote a message",
                options: [
                    {
                        name: "message",
                        description: "The id or url of the message to quote",
                        type: "STRING",
                    },
                ],
            },
            {
                name: "quote",
                type: "MESSAGE",
            },
        ];
    }

    override async handleCommand(interaction: BaseCommandInteraction): Promise<void> {
        if (!QUOTE_ROLE_ID) return;

        const commandIssuerMember = await interaction.guild?.members?.fetch(interaction.user);
        if (!commandIssuerMember)
            return interaction.reply({
                ephemeral: true,
                content: "Command only available on the SerenityOS Discord Server",
            });

        if (!commandIssuerMember.roles.cache.has(QUOTE_ROLE_ID))
            return interaction.reply({ ephemeral: true, content: "Insufficient permission" });

        const messageReference = await this.getMessageReference(interaction);
        if (!messageReference) return;

        if (messageReference.guildId == undefined) {
            const sadcaret = await getSadCaret(interaction);

            return await interaction.reply({
                content: `Failed to obtain the guild ID ${sadcaret ?? ":^("}`,
                ephemeral: true,
            });
        }

        // Accessing GitHub APIs for PR creation can easily exceed 3s.
        // After that, the interaction ID is gone if we don't defer the reply.
        await interaction.deferReply();

        const guildId: string = messageReference.guildId;
        const guild = await this.getGuild(interaction.client, guildId);
        if (!guild) return;

        const message = await this.getMessageByReference(guild, messageReference);
        if (!message) return;

        const nickname = await this.getAuthorNick(guild, message.author);
        const fortunes = await githubAPI.fetchSerenityFortunes();

        fortunes.push({
            quote: message.cleanContent,
            author: nickname,
            url: message.url,
            // eslint-disable-next-line camelcase
            utc_time: Math.floor(Date.now() / 1000),
        });

        const commandIssuerNick = await this.getAuthorNick(guild, interaction.user);
        const pullRequestNumber = await githubAPI.openFortunesPullRequest(
            fortunes,
            commandIssuerNick,
            nickname
        );

        if (pullRequestNumber == undefined) {
            const sadcaret = await getSadCaret(interaction);

            await interaction.editReply(`Failed creating a pull request ${sadcaret ?? ":^("}`);
            return;
        }

        await interaction.editReply(
            `Pull Request opened! https://github.com/${SERENITY_REPOSITORY.owner}/${SERENITY_REPOSITORY.name}/pull/${pullRequestNumber}`
        );
    }

    override async handleContextMenu(interaction: ContextMenuInteraction): Promise<void> {
        return this.handleCommand(interaction);
    }

    private async getMessageReference(
        interaction: BaseCommandInteraction
    ): Promise<MessageReference | undefined> {
        if (!interaction.inGuild()) {
            interaction.reply({
                ephemeral: true,
                content: "Command only available on the SerenityOS Discord Server",
            });

            return;
        }

        // Option 2: A context menu was used on the quote
        if (interaction.isContextMenu() && interaction.targetType === "MESSAGE") {
            return {
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: interaction.targetId,
            };
        }

        // Option 3: A command was used for quoting
        if (!interaction.isCommand()) return;

        const argument = interaction.options.getString("messsage");
        if (!argument) return;

        // Option 3a: The quote was linked
        const messageURLMatch = argument.match(this.messageLinkRegex);
        if (messageURLMatch != null && messageURLMatch.groups != undefined) {
            return {
                guildId: messageURLMatch.groups.guild,
                channelId: messageURLMatch.groups.channel,
                messageId: messageURLMatch.groups.message,
            };
        }

        const originalMessage = await interaction.channel?.messages.fetch(interaction.commandId);
        if (!originalMessage) return;

        // Option 3b: The quote's message ID was given
        try {
            const message = await originalMessage.channel.messages.fetch(argument);
            if (message.guild == null) return;
            return {
                guildId: message.guild.id,
                channelId: message.channel.id,
                messageId: message.id,
            };
        } catch (e) {
            console.trace(e);
            return;
        }
    }

    private async getMessageByReference(
        guild: Guild,
        messageReference: MessageReference
    ): Promise<Message | undefined> {
        if (messageReference.messageId == null) return;
        try {
            const channel = guild.channels.resolve(messageReference.channelId);
            if (channel == null || !channel.isText()) return;
            return await channel.messages.fetch(messageReference.messageId);
        } catch (e) {
            console.trace(e);
            return;
        }
    }

    private async getGuild(client: Client, guildId: string): Promise<Guild | undefined> {
        try {
            return await client.guilds.fetch(guildId);
        } catch (e) {
            console.trace(e);
            return;
        }
    }

    private async getAuthorNick(guild: Guild, user: User): Promise<string> {
        const member = await guild.members.fetch(user);
        return member ? member.displayName : user.username;
    }
}
