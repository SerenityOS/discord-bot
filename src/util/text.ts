/*
 * Copyright (c) 2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

// Discord limits length of titles to 100 chars.
export function trimString(str: string, length = 100) {
    return str.length >= length ? str.slice(0, length - 3) + "..." : str;
}
