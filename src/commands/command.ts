/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";

export default abstract class Command {
    /** Execute the command. */
    abstract run(interaction: CommandInteraction): Promise<void>;

    abstract data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[];
}
