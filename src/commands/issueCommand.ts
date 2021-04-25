import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import githubAPI from "../apis/githubAPI";

export class IssueCommand implements Command {
    matchesName(commandName: string): boolean {
        return "issue" == commandName || "issues" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use ${commandPrefix}issue <keywords> to search for SerenityOS issues`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const result = await githubAPI.search_issues(parsedUserCommand.args.join("+"));
        if (result) {
            await parsedUserCommand.send(`${result.html_url}`);
        } else {
            await parsedUserCommand.send(`No matching issues found :^(`);
        }
    }
}
