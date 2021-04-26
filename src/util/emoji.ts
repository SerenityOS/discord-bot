import { Message } from "discord.js";

/** Gets a displayable emoji string from the message's guild */
export function getEmoji(message: Message, name: string): string | null {
    if (!message.guild) return null;
    const emoji = message.guild.emojis.cache.find(emoji => emoji.name === name);
    if (!emoji) return null;
    return emoji.toString();
}

/** Alias function fot the :sadcaret: emoji */
export function getSadCaret(message: Message): string | null {
    return getEmoji(message, "sadcaret");
}
