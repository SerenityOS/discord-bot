import { MessageEmbed } from "discord.js";
import { RestEndpointMethodTypes } from "@octokit/rest";
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
        return `Use **${commandPrefix}pr [ <keywords> | <number> ]** to search for SerenityOS pull requests`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;

        if (args.length == 1) {
            const number = Number(args[0]);
            if (!isNaN(number)) {
                const result = await githubAPI.search_pull_request(number);
                let embed: MessageEmbed | string;

                if (result) {
                    embed = this.embedFromPr(parsedUserCommand, result);
                } else {
                    embed = "No matching PRs found <:sadcaret:832714137166676018>";
                }

                await parsedUserCommand.send(embed);

                return;
            }
        }

        const result = await githubAPI.search_pull_requests(parsedUserCommand.args.join("+"));
        if (result) {
            const pr = await githubAPI.search_pull_request(result.number);
            if (pr) {
                await parsedUserCommand.send(this.embedFromPr(parsedUserCommand, pr));
                return;
            }
        }

        await parsedUserCommand.send(
            `No matching pull requests found <:sadcaret:832714137166676018>`
        );
    }

    private embedFromPr(
        parsedUserCommand: CommandParser,
        pr: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"]
    ) {
        let description = pr.body || "";
        if (description.length > 300) {
            description = description.slice(0, 300) + "...";
        }

        let color: string;

        if (pr.draft) {
            color = "#768390";
        } else {
            color = pr.state === "open" ? "#57ab5a" : "#e5534b";
        }

        const embed = parsedUserCommand
            .embed()
            .setColor(color)
            .setTitle(pr.title)
            .setURL(pr.html_url)
            .setDescription(description)
            .addField("Created", new Date(pr.created_at).toDateString(), true)
            .addField("Commits", `${pr.commits} (+${pr.additions} -${pr.deletions})`, true)
            .addField("Comments", pr.comments, true);

        if (pr.user) {
            embed.setThumbnail(pr.user.avatar_url).setAuthor(pr.user.login);
        }

        return embed;
    }
}
