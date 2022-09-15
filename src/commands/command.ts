/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    ButtonInteraction,
    CommandInteraction,
    ContextMenuCommandInteraction,
    SelectMenuInteraction,
} from "discord.js";

export default abstract class Command {
    /** Execute the command. */
    abstract handleCommand(interaction: CommandInteraction): Promise<void>;

    handleContextMenu?(interaction: ContextMenuCommandInteraction): Promise<void>;

    handleSelectMenu?(interaction: SelectMenuInteraction): Promise<void>;

    handleButton?(interaction: ButtonInteraction): Promise<void>;

    abstract data(): ApplicationCommandData | ApplicationCommandData[];

    buttonData?(): Array<string>;
}
