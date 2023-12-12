/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    Client,
    ChatInputCommandInteraction,
    Guild,
    Message,
    MessageReference,
    User,
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ContextMenuCommandInteraction,
    ChannelType,
} from "discord.js";
import githubAPI, { SERENITY_REPOSITORY } from "../apis/githubAPI";
import { QUOTE_ROLE_ID } from "../config/secrets";
import { getSadCaret } from "../util/emoji";
import Command from "./command";

export class QuoteCommand extends Command {
    private readonly messageLinkRegex: RegExp =
        /https:\/\/(?:(?:ptb|canary)\.)?discord\.com\/channels\/(?<guild>\d*)\/(?<channel>\d*)\/(?<message>\d*)$/;

    override data() {
        if (!QUOTE_ROLE_ID) return [];

        return [
            new SlashCommandBuilder()
                .setName("quote")
                .setDescription("Quote a message")
                .addStringOption(message =>
                    message
                        .setName("message")
                        .setDescription("The id or url of the message to quote")
                        .setRequired(true)
                )
                .toJSON(),
            new ContextMenuCommandBuilder()
                .setName("quote")
                .setType(ApplicationCommandType.Message)
                .toJSON(),
        ];
    }

    override async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!QUOTE_ROLE_ID) return;

        const commandIssuerMember = await interaction.guild?.members?.fetch(interaction.user);
        if (!commandIssuerMember) {
            interaction.reply({
                ephemeral: true,
                content: "Command only available on the SerenityOS Discord Server",
            });
            return;
        }

        if (!commandIssuerMember.roles.cache.has(QUOTE_ROLE_ID)) {
            interaction.reply({ ephemeral: true, content: "Insufficient permission" });
            return;
        }

        const messageReference = await this.getMessageReference(interaction);
        if (!messageReference) return;

        if (messageReference.guildId == undefined) {
            const sadcaret = await getSadCaret(interaction);

            await interaction.reply({
                content: `Failed to obtain the guild ID ${sadcaret ?? ":^("}`,
                ephemeral: true,
            });
            return;
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

    override async handleContextMenu(interaction: ContextMenuCommandInteraction): Promise<void> {
        return this.handleCommand(interaction as unknown as ChatInputCommandInteraction);
    }

    private async getMessageReference(
        interaction: ContextMenuCommandInteraction | ChatInputCommandInteraction
    ): Promise<MessageReference | undefined> {
        if (!interaction.inGuild()) {
            interaction.reply({
                ephemeral: true,
                content: "Command only available on the SerenityOS Discord Server",
            });

            return;
        }

        // Option 2: A context menu was used on the quote
        if (interaction.isContextMenuCommand()) {
            return {
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: interaction.targetId,
            };
        }

        // Option 3: A command was used for quoting
        if (!interaction.isCommand()) return;

        const argument = interaction.options.getString("message");
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

        // Option 3b: The quote's message ID was given
        try {
            const message = await interaction.channel?.messages.fetch(argument);
            if (message?.guild == null) return;
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
            if (channel == null || channel.type !== ChannelType.GuildText) return;
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
