import { CommandParser } from "../models/commandParser";

export default interface Command {
    /** Checks if the given command name matches this command **/
    matchesName(commandName: string): boolean;

    /** Usage documentation. */
    help(commandPrefix: string): string;

    /** Execute the command. */
    run(parsedUserCommand: CommandParser): Promise<void>;
}
