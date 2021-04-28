/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client, Emoji } from "discord.js";
import { GUILD_ID } from "../config/secrets";

type ClientOrParent = Client | { client: Client };

const cache: Map<string, Emoji> = new Map();

/** Gets a displayable emoji string from the message's guild */
export async function getEmoji(
    clientOrParent: ClientOrParent,
    emojiName: string
): Promise<Emoji | null> {
    // check the cache first O(1)
    const cached = cache.get(emojiName);
    if (cached) return cached;

    // check for guild in discord's cache or fetch using the api
    if (!GUILD_ID) return null;

    const client: Client =
        clientOrParent instanceof Client ? clientOrParent : clientOrParent.client;
    const guild = await client.guilds.fetch(GUILD_ID);

    // otherwise check discord's emoji list
    const emoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
    if (!emoji) return null;

    // cache found emoji for faster lookup later
    cache.set(emojiName, emoji);

    return emoji;
}

/** Alias function for the :sadcaret: emoji */
export async function getSadCaret(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return getEmoji(clientOrParent, "sadcaret");
}

/** Alias function for the :maximize: emoji */
export async function getMaximize(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return getEmoji(clientOrParent, "maximize");
}

/** Alias function for the :minimize: emoji */
export async function getMinimize(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return getEmoji(clientOrParent, "minimize");
}
