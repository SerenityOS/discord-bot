import { Message } from "discord.js";
import { BuildCommand, FaqCommand } from "./commands";
import Command from "./commands/commandInterface";
import { CommandParser } from "./models/commandParser";

export default class CommandHandler {
    private commands: Command[];

    private readonly prefix: string;

    private readonly production: boolean;

    constructor(prefix: string, production: boolean) {
        const commandClasses = [BuildCommand, FaqCommand];

        this.commands = commandClasses.map(commandClass => new commandClass());
        this.prefix = prefix;
        this.production = production;
    }

    /** Executes user commands contained in a message if appropriate. */
    async handleMessage(message: Message): Promise<void> {
        if (message.author.bot || !this.isCommand(message)) {
            return;
        }

        if (!this.production) {
            message.reply(
                `Buggie bot recieved '${this.echoMessage(message)}' from ${message.author.tag}`
            );
        }

        const commandParser = new CommandParser(message, this.prefix);

        const matchedCommand = this.commands.find(command =>
            command.commandNames.includes(commandParser.parsedCommandName)
        );

        if (!matchedCommand) {
            await message.reply(`I don't recognize that command. Try !help.`);
        } else {
            await matchedCommand.run(message).catch(error => {
                message.reply(`'${this.echoMessage(message)}' failed because of ${error}`);
            });
        }
    }

    /** Sends back the message content after removing the prefix. */
    echoMessage(message: Message): string {
        return message.content.replace(this.prefix, "").trim();
    }

    /** Determines whether or not a message is a user command. */
    private isCommand(message: Message): boolean {
        return message.content.startsWith(this.prefix);
    }
}
