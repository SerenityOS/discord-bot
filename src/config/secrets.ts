/*
 * Copyright (c) 2021, the SerenityOS developers.
 * Copyright (c) 2023, networkException <networkexception@serenityos.org>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const DISCORD_TOKEN = process.env["discord_token"];
export const GITHUB_TOKEN = process.env["github_token"];
export const ANNOUNCEMENT_MASTODON_TOKEN = process.env["announcement_mastodon_token"];
export let GUILD_ID = process.env["guild_id"];
export let QUOTE_ROLE_ID = process.env["quote_role_id"];
export let ANNOUNCEMENT_CHANNEL_ID = process.env["announcement_channel_id"];
export let ANNOUNCEMENT_MASTODON_URL = process.env["announcement_mastodon_url"];

if (!DISCORD_TOKEN) {
    console.error("No 'discord_token' provided in .env file.");
}
if (!GITHUB_TOKEN) {
    console.error(
        "No 'github_token' provided in .env file, the rate limit will be greatly reduced!"
    );
}
if (!ANNOUNCEMENT_MASTODON_TOKEN) {
    console.warn("No 'announcement_mastodon_token' provided in .env file.");
}
if (!GUILD_ID) {
    console.warn("No 'guild_id' provided in .env file, using id of the SerenityOS guild.");

    GUILD_ID = "830522505605283862";
}
if (!QUOTE_ROLE_ID) {
    console.warn(
        "No 'quote_role_id' provided in .env file, using id of the SerenityOS reviewer role."
    );

    QUOTE_ROLE_ID = "830720377025986561";
}
if (!ANNOUNCEMENT_CHANNEL_ID) {
    console.warn(
        "No 'announcement_channel_id' provided in .env file, using id of SerenityOS #content-announce channel."
    );

    ANNOUNCEMENT_CHANNEL_ID = "830565751257169920";
}
if (!ANNOUNCEMENT_MASTODON_URL) {
    console.warn(
        "No 'announcement_mastodon_url' provided in .env file, using url of serenityos.social server."
    );

    ANNOUNCEMENT_MASTODON_URL = "https://serenityos.social/api/v1/";
}
