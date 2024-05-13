/*
 * Copyright (c) 2024, Andrew Kaster <akaster@serenityos.org>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import Command from "./command.js";

export class SlapCommand extends Command {
    private readonly baseReply: string = `*$USER slaps $TARGET around a bit with a large trout*`;

    override data() {
        const aliases = ["slap"];
        const description = "Slap someone around a bit with a large trout";

        const baseCommand = new SlashCommandBuilder()
            .setDescription(description)
            .addUserOption(user => user.setName("target").setDescription("The user to slap"));

        return aliases.map(name => baseCommand.setName(name).toJSON());
    }

    override async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        let content = this.baseReply;

        const target = interaction.options.getMember("target");
        const user = interaction.member;
        let username = "";
        if (user instanceof GuildMember) {
            username = user.displayName;
        } else {
            username = user?.nick ?? user?.user.username ?? "Someone";
        }

        let targetName = "";
        if (target instanceof GuildMember) {
            targetName = target.displayName;
        } else {
            targetName = target?.nick ?? "Someone";
        }

        if (user) content = content.replace("$USER", `${username}`);
        if (target) content = content.replace("$TARGET", `${targetName}`);

        await interaction.reply({
            content,
        });
    }
}
