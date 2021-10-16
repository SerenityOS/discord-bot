/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ApplicationCommandData, BaseCommandInteraction } from "discord.js";

export default abstract class Command {
    /** Execute the command. */
    abstract run(interaction: BaseCommandInteraction): Promise<void>;

    abstract data(): ApplicationCommandData | ApplicationCommandData[];
}
