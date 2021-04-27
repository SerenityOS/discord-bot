/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Message } from "discord.js";

const cache: Map<string, Map<string, string>> = new Map();

/** Gets a displayable emoji string from the message's guild */
export function getEmoji(message: Message, name: string): string | null {
    // guid == null in dms, where we don't have access to custom emojis
    if (!message.guild) return null;

    // check the cache first O(1)
    const cached = cache.get(message.guild.id)?.get(name);
    if (cached) return cached;

    // otherwise check discord's emoji list
    const emoji = message.guild.emojis.cache.find(emoji => emoji.name === name)?.toString();
    if (!emoji) return null;

    // cache found emoji for faster lookup later
    if (!cache.get(message.guild.id)) cache.set(message.guild.id, new Map());
    cache.get(message.guild.id)?.set(name, emoji);

    return emoji;
}

/** Alias function for the :sadcaret: emoji */
export function getSadCaret(message: Message): string | null {
    return getEmoji(message, "sadcaret");
}

/** Alias function for the :maximize: emoji */
export function getMaximize(message: Message): string | null {
    return getEmoji(message, "maximize");
}

/** Alias function for the :minimize: emoji */
export function getMinimize(message: Message): string | null {
    return getEmoji(message, "minimize");
}
