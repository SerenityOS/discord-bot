/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { BaseCommandInteraction, ChatInputApplicationCommandData, MessageEmbed } from "discord.js";
import { getEmoji } from "../util/emoji";
import Command from "./command";

export class EmojiCommand extends Command {
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        return {
            name: "emoji",
            description: "Make Buggie post an emoji",
            options: [
                {
                    name: "emoji",
                    description: "The emoji to post",
                    type: "STRING",
                    required: true,
                },
            ],
        };
    }

    override async run(interaction: BaseCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const result = await getEmoji(interaction, interaction.options.getString("emoji", true));

        if (result?.url) {
            return await interaction.reply({
                embeds: [new MessageEmbed().setThumbnail(result.url)],
            });
        }

        await interaction.reply({ ephemeral: true, content: "Emoji not found" });
    }
}
