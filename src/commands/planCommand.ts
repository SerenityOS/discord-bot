/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./command";
import {
    ChatInputApplicationCommandData,
    ApplicationCommandOptionData,
    CommandInteraction,
} from "discord.js";

export class PlanCommand extends Command {
    private readonly baseReply: string = `> Will SerenityOS support \`$THING\`?\nMaybe. Maybe not. There is no plan.\n\nSee: [FAQ](<https://github.com/SerenityOS/serenity/blob/master/Documentation/FAQ.md>)`;

    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        const description = "Check if a feature is part of the plan";
        const options: ApplicationCommandOptionData[] = [
            {
                name: "feature",
                description: "The feature to check",
                type: "STRING",
            },
        ];

        return [
            {
                name: "plan",
                description,
                options,
            },
            {
                name: "wen",
                description,
                options,
            },
        ];
    }

    override async run(interaction: CommandInteraction): Promise<void> {
        let content = this.baseReply;

        const feature = interaction.options.getString("feature");

        if (feature) content = content.replace("`$THING`", feature);

        await interaction.reply({
            content,
        });
    }
}
