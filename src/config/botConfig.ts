/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

type BotConfig = {
    prefix: string /** Prefix used for bot commands. */;
    production: boolean;
};

const config: BotConfig = {
    prefix: "!",
    production: process.env.NODE_ENV === "production",
};

export default config;
