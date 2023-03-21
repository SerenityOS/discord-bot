/*
 * Copyright (c) 2023, networkException <networkexception@serenityos.org>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Message } from "discord.js";
import Mastodon from "mastodon";
import { ANNOUNCEMENT_MASTODON_TOKEN, ANNOUNCEMENT_MASTODON_URL } from "./config/secrets";

let mastodon: Mastodon;

export async function postAnnouncement(message: Message): Promise<void> {
    if (!ANNOUNCEMENT_MASTODON_TOKEN) return;

    if (!mastodon) {
        mastodon = new Mastodon({
            // eslint-disable-next-line camelcase
            access_token: ANNOUNCEMENT_MASTODON_TOKEN,
            // eslint-disable-next-line camelcase
            timeout_ms: 60 * 1000,
            // eslint-disable-next-line camelcase, @typescript-eslint/no-non-null-assertion
            api_url: ANNOUNCEMENT_MASTODON_URL!,
        });
    }

    const author = message.member?.nickname ?? message.author.username;

    try {
        await mastodon.post("statuses", {
            status: `${author} announces:\n\n${message.content}`,
            visibility: "public",
        });
    } catch (e) {
        console.error("Failed to post a toot!", e);
    }
}
