import { Message } from "discord.js";

/** Gets a displayable emoji string from the message's guild */
export function getEmoji(message: Message, name: string): string | null {
    if (!message.guild) return null;
    const emoji = message.guild.emojis.cache.find(emoji => emoji.name === name);
    if (!emoji) return null;
    return emoji.toString();
}
