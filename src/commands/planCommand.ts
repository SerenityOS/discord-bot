/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";

export class PlanCommand implements Command {
    private readonly baseReply: string = `> Will SerenityOS support \`$THING\`?\nMaybe. Maybe not. There is no plan.\n(source: <https://github.com/SerenityOS/serenity/blob/master/Documentation/FAQ.md>)`;
    matchesName(commandName: string): boolean {
        return "plan" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}plan [ <feature> ]** to check if a feature is part of the plan`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        let reply = this.baseReply;
        const args = parsedUserCommand.args;
        if (args.length > 0) {
            reply = reply.replace("`$THING`", args.join(" "));
        }

        await parsedUserCommand.send(reply);
    }
}
