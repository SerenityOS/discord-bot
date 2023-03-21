/*
 * Copyright (c) 2023, networkException <networkexception@serenityos.org>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

declare module "mastodon" {
    export default class Mastodon {
        public constructor(options: { access_token: string; timeout_ms: number; api_url: string });

        public post(
            method: "statuses",
            options: { status: string; visibility: "public" }
        ): Promise<void>;
    }
}
