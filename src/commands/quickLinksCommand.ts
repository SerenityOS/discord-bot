import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import assert from "assert";

export class QuickLinksCommand implements Command {
    readonly links: { help: string; response: string; name: string }[] = [
        {
            name: "faq",
            response: "FAQ: http://serenityos.org/faq/",
            help: "get a link to the SerenityOS FAQ",
        },
        {
            name: "build",
            response:
                "How To Build: https://github.com/SerenityOS/serenity/blob/master/Documentation/BuildInstructions.md",
            help: "get a link to the build docs",
        },
        {
            name: "wsl",
            response:
                "WSL Specific Notes: https://github.com/SerenityOS/serenity/blob/master/Documentation/NotesOnWSL.md",
            help: "get a link to the wsl specific notes",
        },
    ];

    matchesName(commandName: string): boolean {
        return this.links.some(link => link.name === commandName);
    }

    help(commandPrefix: string): string {
        return this.links
            .map(link => `Use ${commandPrefix}${link.name} to ${link.help}.`)
            .join("\n");
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const link = this.links.find(link => link.name === parsedUserCommand.parsedCommandName);
        assert(link);
        await parsedUserCommand.send(link.response);
        try {
            await parsedUserCommand.originalMessage.delete();
        } catch (e) {
            // noop catch to ignore permission errors when deleting messages of higher rank users
        }
    }
}
