import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import githubAPI from "../apis/githubAPI";

export class PRCommand implements Command {
    matchesName(commandName: string): boolean {
        return (
            "pr" == commandName ||
            "prs" == commandName ||
            "pullrequest" == commandName ||
            "pullrequests" == commandName
        );
    }

    help(commandPrefix: string): string {
        return `Use ${commandPrefix}pr <keywords> to search for SerenityOS pull requests`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const result = await githubAPI.search_pull_requests(parsedUserCommand.args.join("+"));
        if (result) {
            await parsedUserCommand.send(`${result.html_url}`);
        } else {
            await parsedUserCommand.send(`No matching pull requests found :sadcaret:`);
        }
    }
}
