/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

type BotConfig = {
    production: boolean;
};

const config: BotConfig = {
    production: process.env.NODE_ENV === "production",
};

export default config;
