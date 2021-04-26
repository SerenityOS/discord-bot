import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import githubAPI from "../apis/githubAPI";
import { getEmoji } from "../util/emoji";

export class ManCommand implements Command {
    matchesName(commandName: string): boolean {
        return "man" == commandName || "manpage" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}man <section> <page>** to display SerenityOS man pages`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;
        if (args.length < 2) {
            await parsedUserCommand.send(`Error: Not enough arguments provided. Ex: !man 2 unveil`);
        } else {
            const section = args[0];
            const page = args[1];
            const result = await githubAPI.fetch_serenity_manpage(section, page);
            if (result) {
                await parsedUserCommand.send(`${result}`);
            } else {
                const sadcaret = getEmoji(parsedUserCommand.originalMessage, "sadcaret");
                await parsedUserCommand.send(`No matching man page found ${sadcaret}`);
            }
        }
    }
}
