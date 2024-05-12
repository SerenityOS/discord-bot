/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 *
 *
 * Intermediate module file for exporting all commands
 * Makes importing several commands simpler
 *
 * before:
 * import { EchoCommand } from "./commands/echoCommand";
 * import { NextCommand } from "./commands/nextCommand";
 *
 * now:
 * import { EchoCommand, NextCommand } from "./commands";
 *
 * DO NOT export command classes using default
 */

export * from "./commitStatsCommand.js";
export * from "./emojiCommand.js";
export * from "./githubCommand.js";
export * from "./manCommand.js";
export * from "./planCommand.js";
export * from "./quickLinksCommand.js";
export * from "./quoteCommand.js";
export * from "./testCommand.js";
export * from "./userCommand.js";
export * from "./slapCommand.js";
