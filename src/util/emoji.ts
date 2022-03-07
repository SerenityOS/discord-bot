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
    if (cached != null) return cached;

    // check for guild in discord's cache or fetch using the api
    if (!GUILD_ID) return null;

    const client: Client =
        clientOrParent instanceof Client ? clientOrParent : clientOrParent.client;
    const guild = await client.guilds.fetch(GUILD_ID);

    // otherwise check discord's emoji list
    const emoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
    if (emoji == null) return null;

    // cache found emoji for faster lookup later
    cache.set(emojiName, emoji);

    return emoji;
}

/** Alias function for the :sadcaret: emoji */
export async function getSadCaret(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "sadcaret");
}

/** Alias function for the :maximize: emoji */
export async function getMaximize(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "maximize");
}

/** Alias function for the :minimize: emoji */
export async function getMinimize(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "minimize");
}

/** Alias function for the :poggie: emoji */
export async function getPoggie(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "poggie");
}

/** Alias function for the :buggiemagnify: emoji */
export async function getBuggiemagnify(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "buggiemagnify");
}

/** Alias function for the :buggus: emoji */
export async function getBuggus(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "buggus");
}

/** Alias function for the :yakslice: emoji */
export async function getYakslice(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "yakslice");
}

/** Alias function for the :skeleyak: emoji */
export async function getSkeleyak(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "skeleyak");
}

/** Alias function for the :yaksplode: emoji */
export async function getYaksplode(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "yaksplode");
}

/** Alias function for the :neoyak: emoji */
export async function getNeoyak(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "neoyak");
}

/** Alias function for the :libjs: emoji */
export async function getLibjs(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "libjs");
}

/** Alias function for the :thonk: emoji */
export async function getThonk(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "thonk");
}

/** Alias function for the :yakstack: emoji */
export async function getYakstack(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "yakstack");
}

/** Alias function for the :open_issue: emoji */
export async function getOpenIssue(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "open_issue");
}

/** Alias function for the :closed_issue: emoji */
export async function getClosedIssue(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "closed_issue");
}

/** Alias function for the :open_pull: emoji */
export async function getOpenPull(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "open_pull");
}

/** Alias function for the :closed_pull: emoji */
export async function getClosedPull(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "closed_pull");
}

/** Alias function for the :merged_pull: emoji */
export async function getMergedPull(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "merged_pull");
}

/** Alias function for the :yak: emoji */
export async function getYak(clientOrParent: ClientOrParent): Promise<Emoji | null> {
    return await getEmoji(clientOrParent, "yak");
}
