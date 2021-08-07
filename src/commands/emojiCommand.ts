/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import { getEmoji, getThonk } from "../util/emoji";
import { MessageEmbed } from "discord.js";

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

        if (result?.url) {
            const embed = new MessageEmbed()
                .setThumbnail(result.url)
                .setFooter(parsedUserCommand.originalMessage.author.tag);
            await parsedUserCommand.send({ embeds: [embed] });
        } else {
            const thonk = await getThonk(parsedUserCommand.originalMessage);
            if (thonk?.id) await parsedUserCommand.originalMessage.react(thonk.id);
        }
    }
}
