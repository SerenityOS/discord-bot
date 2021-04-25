import Command from "./commandInterface";
import { Message } from "discord.js";

export class BuildCommand implements Command {
    commandNames = ["build"];

    help(commandPrefix: string): string {
        return `Use ${commandPrefix}build to get a link to the build docs.`;
    }

    async run(message: Message): Promise<void> {
        await message.reply(
            "How To Build: https://github.com/SerenityOS/serenity/blob/master/Documentation/BuildInstructions.md"
        );
    }
}
