/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./command";
import { ApplicationCommandData, CommandInteraction } from "discord.js";

export class PlanCommand extends Command {
    private readonly baseReply: string = `> Will SerenityOS support \`$THING\`?\nMaybe. Maybe not. There is no plan.\n\nSee: [FAQ](<https://github.com/SerenityOS/serenity/blob/master/Documentation/FAQ.md>)`;

    override data(): ApplicationCommandData | ApplicationCommandData[] {
        return {
            name: "plan",
            description: "Check if a feature is part of the plan",
            options: [
                {
                    name: "feature",
                    description: "The feature to check",
                    type: "STRING",
                },
            ],
        };
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
