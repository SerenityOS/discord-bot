/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import { getEmoji, getThonk } from "../util/emoji";

export class EmojiCommand implements Command {
    matchesName(commandName: string): boolean {
        return "emoji" === commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}emoji <name>** to make Buggie post an emoji`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;

        if (args.length !== 1) {
            await parsedUserCommand.send("Error: One argument required");
            return;
        }

        const result = await getEmoji(parsedUserCommand.originalMessage, args[0]);

        if (result) {
            await parsedUserCommand.send(result.toString());
        } else {
            const thonk = await getThonk(parsedUserCommand.originalMessage);
            if (thonk?.id) await parsedUserCommand.originalMessage.react(thonk.id);
        }
    }
}
