import Discord, { Message } from "discord.js";
import { DISCORD_TOKEN } from "./config/secrets";
import CommandHandler from "./commandHandler";
import config from "./config/botConfig";

const client = new Discord.Client();

const commandHandler = new CommandHandler(config.prefix, config.production);

client.on("ready", () => {
    console.log("Buggie bot has started");
});
client.on("message", (message: Message) => {
    commandHandler.handleMessage(message);
});
client.on("error", e => {
    console.error("Discord client error!", e);
});

client.login(DISCORD_TOKEN);
