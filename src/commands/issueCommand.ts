import { MessageEmbed } from "discord.js";
import { RestEndpointMethodTypes } from "@octokit/rest";
import Command from "./commandInterface";
import { CommandParser } from "../models/commandParser";
import githubAPI from "../apis/githubAPI";
import { getSadCaret } from "../util/emoji";

export class IssueCommand implements Command {
    matchesName(commandName: string): boolean {
        return "issue" == commandName || "issues" == commandName;
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}issue [ <keywords> | <number> ]** to search for SerenityOS issues`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;

        if (args.length == 1) {
            const number = Number(args[0]);
            if (!isNaN(number)) {
                const result = await githubAPI.search_issue(number);
                let embed: MessageEmbed | string;

                if (result) {
                    embed = this.embedFromIssue(parsedUserCommand, result);
                } else {
                    const sadcaret = getSadCaret(parsedUserCommand.originalMessage);
                    embed = `No matching issues found ${sadcaret}`;
                }

                await parsedUserCommand.send(embed);

                return;
            }
        }

        const result = await githubAPI.search_issues(args.join("+"));
        if (result) {
            const embed = this.embedFromIssue(parsedUserCommand, result);
            await parsedUserCommand.send(embed);
        } else {
            const sadcaret = getSadCaret(parsedUserCommand.originalMessage);
            await parsedUserCommand.send(`No matching issues found ${sadcaret}`);
        }
    }

    private embedFromIssue(
        parsedUserCommand: CommandParser,
        issue: RestEndpointMethodTypes["issues"]["get"]["response"]["data"]
    ) {
        let description = issue.body || "";
        if (description.length > 300) {
            description = description.slice(0, 300) + "...";
        }

        const color = issue.state === "open" ? "#57ab5a" : "#e5534b";

        const embed = parsedUserCommand
            .embed()
            .setColor(color)
            .setTitle(issue.title)
            .setURL(issue.html_url)
            .setDescription(description)
            .addField("Created", new Date(issue.created_at).toDateString(), true)
            .addField("Comments", issue.comments, true);

        if (issue.user) {
            embed.setThumbnail(issue.user.avatar_url).setAuthor(issue.user.login);
        }

        return embed;
    }
}
