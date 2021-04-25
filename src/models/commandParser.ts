import { Message } from "discord.js";

/** A user-given command extracted from a message. */
export class CommandParser {

  readonly parsedCommandName: string;  /** Command name in all lowercase. */
  readonly args: string[];             /** Arguments (split by space). */
  readonly originalMessage: Message;   /** Original Message the command was extracted from. */
  readonly commandPrefix: string;

  constructor(message: Message, prefix: string) {

    this.commandPrefix = prefix;
    const splitMessage = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = splitMessage.shift() || "";
    this.parsedCommandName = commandName.toLowerCase();
    this.args = splitMessage;
    this.originalMessage = message;
  }
}