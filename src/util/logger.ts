/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client, ColorResolvable, MessageEmbed } from "discord.js";
import { GUILD_ID, LOG_CHANNEL_ID } from "../config/secrets";

import config from "../config/botConfig";
import util from "node:util";

export enum LogLevel {
    Fatal = 0,
    Trace,
    Error,
    Warn,
    Info,
    Verbose,
    Debug,
    Silly,
}
export class Logger {
    // Handle pre-setup logs
    private running = false;
    private startupQueue: MessageEmbed[] = [];

    private client?: Client;
    private channel: any;

    private _level: LogLevel = config.logLevel;
    public get level() {
        return this._level;
    }

    public async start() {
        this.running = true;

        // We're now up and running, let's emit the startup log.
        // FIXME: Group them together (discord allows for up to 10
        //        in one single message, it's a bit hit and miss
        //        with our current discord.js version though).
        await Promise.all(
            this.startupQueue
                .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
                .map(async card => await this.emitToDiscord([card]))
        );
        this.startupQueue = [];
    }

    public fatal(...message: any) {
        this.handleLogMessage(LogLevel.Fatal, ...message)
            .then(() => process.exit(1))
            .catch(e => {
                console.trace(e);
                process.exit(1);
            });
    }
    public trace(...message: any) {
        this.handleLogMessage(LogLevel.Trace, ...message);
    }
    public error(...message: any) {
        this.handleLogMessage(LogLevel.Error, ...message);
    }
    public warn(...message: any) {
        this.handleLogMessage(LogLevel.Warn, ...message);
    }
    public info(...message: any) {
        this.handleLogMessage(LogLevel.Info, ...message);
    }
    public verbose(...message: any) {
        this.handleLogMessage(LogLevel.Verbose, ...message);
    }
    public debug(...message: any) {
        this.handleLogMessage(LogLevel.Debug, ...message);
    }
    public silly(...message: any) {
        this.handleLogMessage(LogLevel.Silly, ...message);
    }

    public async setClient(client: Client) {
        this.client = client;

        if (!GUILD_ID || !LOG_CHANNEL_ID) return;
        this.channel = await (
            await this.client.guilds.fetch(GUILD_ID)
        ).channels.fetch(LOG_CHANNEL_ID);
    }

    public setLevel(level: LogLevel) {
        this._level = level;
    }

    public async clear(amount = 100) {
        await this.channel.bulkDelete(amount);
    }

    public getLevelColor(level: LogLevel): ColorResolvable {
        switch (level) {
            case LogLevel.Fatal:
            case LogLevel.Trace:
            case LogLevel.Error:
                return "#FF0000";
            case LogLevel.Warn:
                return "#FFFF00";
            case LogLevel.Verbose:
                return "#8AE234";
            case LogLevel.Silly:
                return "#800080";
            default:
                return "#729FCF";
        }
    }

    private printToCorrectConsole(level: LogLevel, prefix: string, ...data: any[]) {
        let consoleMethod = console.log;
        switch (level) {
            case LogLevel.Fatal: {
                consoleMethod = console.debug;
                break;
            }
            case LogLevel.Error: {
                consoleMethod = console.error;
                break;
            }
            case LogLevel.Warn: {
                consoleMethod = console.warn;
                break;
            }
            case LogLevel.Info: {
                consoleMethod = console.info;
                break;
            }
            case LogLevel.Trace:
            case LogLevel.Debug: {
                consoleMethod = console.debug;
                break;
            }
            default:
                consoleMethod = console.log;
        }
        consoleMethod(
            prefix,
            util
                .formatWithOptions(
                    {
                        colors: true,
                        breakLength: 60,
                        compact: false,
                    },
                    "%o",
                    ...data
                )
                .split("\n")
                .join("\n".padEnd(4)) // Indent multiline-outputs
        );
    }

    private async emitToDiscord(cards: MessageEmbed[]) {
        await this.channel.send({
            embeds: cards,
        });
    }

    private async handleLogMessage(level: LogLevel, ...data: any[]) {
        const caller = (data[0] instanceof Error ? data[0] : new Error(""))?.stack
            ?.split("\n")[3]
            .replace("    at ", "") as string;

        let base = "";
        if (caller?.includes("/build/")) base = "/build/";
        else if (caller?.includes("/src/")) base = "/src/";

        const file = caller?.split(base)[1].split(")")[0];
        const line = file.split(":")[1];
        const method = caller.split(" ")[0];

        const msg = util.formatWithOptions(
            {
                colors: false,
                breakLength: 60, // to fit inside a discord embed.
                maxStringLength: 4000, // discord's max is 4096.
            },
            "%o",
            ...data
        );

        this.printToCorrectConsole(
            level,
            `${LogLevel[level].toUpperCase()}${
                this.level > LogLevel.Info ? ` [${file}]` : ""
            } [${method}]:`,
            ...data
        );

        if ((!this.channel && this.running) || level > this.level) return;

        const card = new MessageEmbed()
            .setColor(this.getLevelColor(level))
            .setAuthor({
                name: "BuggieBot",
                iconURL: "https://github.com/BuggieBot.png",
                url: "https://github.com/BuggieBot",
            })
            .setTitle(`${LogLevel[level].toUpperCase()} - SerenityOS/discord-bot`)
            .setURL(`https://github.com/SerenityOS/discord-bot`)
            .setDescription(`${"```javascript\n"}${msg}${"```"}`)
            .addFields(
                {
                    name: "Method",
                    value: method,
                    inline: true,
                },
                {
                    name: "Filename",
                    value: `[${file}](https://github.com/SerenityOS/discord-bot/tree/master/src/${
                        file.split(":")[0]
                    }#L${line})`,
                    inline: true,
                }
            )
            .setTimestamp(Date.now());

        if (!this.running) {
            this.startupQueue.push(card);
            return;
        }

        await this.emitToDiscord([card]);
    }
}

const logger = new Logger();
export default logger;
