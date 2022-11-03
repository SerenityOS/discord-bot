/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

type BotConfig = {
    production: boolean;
    excludedRepositories: string[];
};

const config: BotConfig = {
    production: process.env.NODE_ENV === "production",
    excludedRepositories: [
        "serenity-fuzz-corpora",
        "user-map",
        "setup-jakt",
        "artwork",
        "manpages-website",
    ],
};

export default config;
