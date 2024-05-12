/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    RESTPostAPIApplicationCommandsJSONBody,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    SelectMenuInteraction,
} from "discord.js";

export default abstract class Command {
    /** Execute the command. */
    abstract handleCommand(interaction: ChatInputCommandInteraction): Promise<void>;

    handleContextMenu?(interaction: ContextMenuCommandInteraction): Promise<void>;

    handleSelectMenu?(interaction: SelectMenuInteraction): Promise<void>;

    handleButton?(interaction: ButtonInteraction): Promise<void>;

    abstract data(): RESTPostAPIApplicationCommandsJSONBody[];

    buttonData?(): Array<string>;
}
