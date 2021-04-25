import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const DISCORD_TOKEN = process.env["discord_token"];
export const GITHUB_TOKEN = process.env["github_token"];

if (!DISCORD_TOKEN) {
    console.error("No 'discord token' provided in .env file.");
}
if (!GITHUB_TOKEN) {
    console.error(
        "No 'github token' provided in .env file, the rate limit will be greatly reduced!"
    );
}
