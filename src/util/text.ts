/*
 * Copyright (c) 2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

// Discord limits length of titles to 100 chars.
export function trimString(str: string, length = 100) {
    return str.length >= length ? str.slice(0, length - 3) + "..." : str;
}

export function extractCopy<T>(
    score: number,
    copy: Array<{
        min: number;
        max: number;
        copy: T;
    }>
) {
    for (const milestone of copy) {
        if (milestone.min > score) continue;
        if (milestone.max < score) continue;

        return milestone.copy;
    }

    throw new Error("No matching milestone");
}
