import Command from "./commandInterface";
import { Message } from "discord.js";

export class FaqCommand implements Command {
    commandNames = ["faq"];

    help(commandPrefix: string): string {
        return `Use ${commandPrefix}faq to get a link to the SerenityOS FAQ.`;
    }

    async run(message: Message): Promise<void> {
        await message.channel.send("FAQ: http://serenityos.org/faq/");
    }
}
