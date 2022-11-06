/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import dotenv from "dotenv";
import logger from "../util/logger";

dotenv.config({ path: ".env" });

export const DISCORD_TOKEN = process.env["discord_token"];
export const GITHUB_TOKEN = process.env["github_token"];
export let GUILD_ID = process.env["guild_id"];
export let QUOTE_ROLE_ID = process.env["quote_role_id"];
export const LOG_CHANNEL_ID = process.env["log_channel_id"];
export let PRIVILEGED_GROUP_IDS = process.env["privileged_group_ids"]?.split?.(",") as string[];

if (!DISCORD_TOKEN) {
    logger.error("No 'discord_token' provided in .env file.");
}
if (!GITHUB_TOKEN) {
    logger.error(
        "No 'github_token' provided in .env file, the rate limit will be greatly reduced!"
    );
}
if (!GUILD_ID) {
    logger.warn("No 'guild_id' provided in .env file, using id of the SerenityOS guild.");

    GUILD_ID = "830522505605283862";
}
if (!QUOTE_ROLE_ID) {
    logger.warn(
        "No 'quote_role_id' provided in .env file, using id of the SerenityOS reviewer role."
    );

    QUOTE_ROLE_ID = "830720377025986561";
}

if (!LOG_CHANNEL_ID) {
    logger.warn(
        "No 'log_channel_id' provided in .env file, useful debugging information might be lost!"
    );
}
if (!PRIVILEGED_GROUP_IDS || PRIVILEGED_GROUP_IDS.length <= 0) {
    logger.warn("No 'privileged_group_ids' provided in .env file, using the SerenityOS group ids.");

    PRIVILEGED_GROUP_IDS = ["830720377025986561"];
}
