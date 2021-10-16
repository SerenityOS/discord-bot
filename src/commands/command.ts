/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ApplicationCommandData, CommandInteraction, ContextMenuInteraction } from "discord.js";

export default abstract class Command {
    /** Execute the command. */
    abstract handleCommand(interaction: CommandInteraction): Promise<void>;

    handleContextMenu?(interaction: ContextMenuInteraction): Promise<void>;

    abstract data(): ApplicationCommandData | ApplicationCommandData[];
}
