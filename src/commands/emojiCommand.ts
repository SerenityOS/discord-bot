/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getEmoji } from "../util/emoji";
import Command from "./command";

export class EmojiCommand extends Command {
    override data() {
        return [
            new SlashCommandBuilder()
                .setName("emoji")
                .setDescription("Make Buggie post an emoji")
                .addStringOption(emoji =>
                    emoji.setName("emoji").setDescription("The emoji to post").setRequired(true)
                )
                .toJSON(),
        ];
    }

    override async handleCommand(interaction: ChatInputCommandInteraction) {
        const result = await getEmoji(interaction, interaction.options.getString("emoji", true));

        if (result?.url) {
            await interaction.reply({
                embeds: [new EmbedBuilder().setThumbnail(result.url)],
            });
            return;
        }

        await interaction.reply({ ephemeral: true, content: "Emoji not found" });
    }
}
