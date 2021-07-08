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
import { MessageEmbed } from "discord.js";

export class GithubCommand implements Command {
    matchesName(commandName: string): boolean {
        return (
            "gh" === commandName ||
            "github" === commandName ||
            "issue" === commandName ||
            "issues" === commandName ||
            "pr" === commandName ||
            "prs" === commandName ||
            "pullrequest" === commandName ||
            "pullrequests" === commandName
        );
    }

    help(commandPrefix: string): string {
        return `Use **${commandPrefix}gh [ <number> | <keywords> ]** to search for issues or pull requests`;
    }

    async run(parsedUserCommand: CommandParser): Promise<void> {
        const args = parsedUserCommand.args;
        const number = Number(args[0]);

        if (!isNaN(number)) {
            const result = await this.embedFromIssueOrPull(
                parsedUserCommand,
                await githubAPI.getIssueOrPull(number)
            );

            if (result) {
                await parsedUserCommand.send(result);
                return;
            }
        }

        const result = await this.embedFromIssueOrPull(
            parsedUserCommand,
            await githubAPI.searchIssuesOrPulls(parsedUserCommand.args.join("+").substring(0, 256))
        );

        if (result) {
            await parsedUserCommand.send(result);
            return;
        }

        const sadcaret = await getSadCaret(parsedUserCommand.originalMessage);
        await parsedUserCommand.send(`No matching issues or pull requests found ${sadcaret}`);
    }

    private async embedFromIssueOrPull(
        parsedUserCommand: CommandParser,
        issueOrPull: RestEndpointMethodTypes["issues"]["get"]["response"]["data"] | undefined
    ): Promise<MessageEmbed | undefined> {
        if (!issueOrPull) return undefined;

        if (issueOrPull.pull_request) {
            const pull = await githubAPI.getPull(issueOrPull.number);

            if (pull) return this.embedFromPull(parsedUserCommand, pull);
        }

        return this.embedFromIssue(parsedUserCommand, issueOrPull);
    }

    private embedFromIssue(
        parsedUserCommand: CommandParser,
        issue: RestEndpointMethodTypes["issues"]["get"]["response"]["data"]
    ): MessageEmbed {
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

    private embedFromPull(
        parsedUserCommand: CommandParser,
        pull: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"]
    ): MessageEmbed {
        let description = pull.body || "";
        if (description.length > 300) {
            description = description.slice(0, 300) + "...";
        }

        let color: string;

        if (pull.draft) {
            color = "#768390";
        } else if (pull.merged) {
            color = "#6e40c9";
        } else {
            color = pull.state === "open" ? "#57ab5a" : "#e5534b";
        }

        const embed = parsedUserCommand
            .embed()
            .setColor(color)
            .setTitle(pull.title)
            .setURL(pull.html_url)
            .setDescription(description)
            .addField("Created", new Date(pull.created_at).toDateString(), true)
            .addField("Commits", `${pull.commits} (+${pull.additions} -${pull.deletions})`, true)
            .addField("Comments", pull.comments, true);

        const labels = pull.labels
            .map(label => label.name)
            .filter(name => name !== undefined)
            .join(", ");

        if (pull.labels.length !== 0) {
            embed.addField("Labels", labels);
        }

        if (pull.merged && pull.merged_at && pull.merged_by != null) {
            embed.addField(
                "Merged",
                `${new Date(pull.merged_at).toDateString()} by ${pull.merged_by.login}`,
                true
            );
        }

        if (pull.user != null) {
            embed.setThumbnail(pull.user.avatar_url).setAuthor(pull.user.login);
        }

        return embed;
    }
}
