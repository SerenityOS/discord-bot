import { MessageEmbed } from "discord.js";
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
        const args = parsedUserCommand.args;

        if (args.length == 1) {
            const number = Number(args[0]);
            if (!isNaN(number)) {
                const result = await githubAPI.search_issue(number);
                let embed: MessageEmbed | string;

                if (result) {
                    let description = result.body || "";
                    if (description.length > 500) {
                        description = description.slice(0, 500) + "...";
                    }

                    embed = parsedUserCommand
                        .embed()
                        .setAuthor(`Issue ${number}`)
                        .setTitle(result.title)
                        .setURL(result.html_url)
                        .setDescription(description);

                    if (result.user) {
                        embed.setThumbnail(result.user.avatar_url);
                    }
                } else {
                    embed = "No matching issues found :^(";
                }

                await parsedUserCommand.send(embed);

                return;
            }
        }

        const result = await githubAPI.search_issues(args.join("+"));
        if (result) {
            await parsedUserCommand.send(`${result.html_url}`);
        } else {
            await parsedUserCommand.send(`No matching issues found :^(`);
        }
    }
}
