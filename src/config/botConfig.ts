/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import type { LogLevel } from "../util/logger";

type BotConfig = {
    production: boolean;
    excludedRepositories: string[];
    logLevel: LogLevel;
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
    logLevel: process.env.log_level ? Number.parseInt(process.env.log_level, 10) : 5,
};

export default config;
