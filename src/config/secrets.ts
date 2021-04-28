/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const DISCORD_TOKEN = process.env["discord_token"];
export const GITHUB_TOKEN = process.env["github_token"];
export let GUILD_ID = process.env["guild_id"];

if (!DISCORD_TOKEN) {
    console.error("No 'discord token' provided in .env file.");
}
if (!GITHUB_TOKEN) {
    console.error(
        "No 'github token' provided in .env file, the rate limit will be greatly reduced!"
    );
}
if (!GUILD_ID) {
    console.warn("No 'guild id' provided in .env file, using id of the SerenityOS guild.");

    GUILD_ID = "830522505605283862";
}
