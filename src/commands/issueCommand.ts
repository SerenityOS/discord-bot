/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

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
        const number = Number(args[0]);

        if (!isNaN(number)) {
            const result = await githubAPI.searchIssue(number);

            if (result != null) {
                await parsedUserCommand.send(this.embedFromIssue(parsedUserCommand, result));
                return;
            }
        }

        const result = await githubAPI.searchIssues(args.join("+").substring(0, 256));
        if (result) {
            const embed = this.embedFromIssue(parsedUserCommand, result);
            await parsedUserCommand.send(embed);
        } else {
            const sadcaret = await getSadCaret(parsedUserCommand.originalMessage);
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

        const labels = issue.labels
            .map(label => (typeof label === "string" ? label : label.name))
            .filter(name => name !== undefined)
            .join(", ");

        if (labels.length !== 0) {
            embed.addField("Labels", labels);
        }

        if (issue.closed_at && issue.closed_by != null) {
            embed.addField(
                "Closed",
                `${new Date(issue.closed_at).toDateString()} by ${issue.closed_by.login}`,
                true
            );
        }

        if (issue.user != null) {
            embed.setThumbnail(issue.user.avatar_url).setAuthor(issue.user.login);
        }

        return embed;
    }
}
