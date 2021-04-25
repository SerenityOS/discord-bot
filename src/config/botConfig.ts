type BotConfig = {
    prefix: string /** Prefix used for bot commands. */;
    production: boolean;
};

const config: BotConfig = {
    prefix: "!",
    production: process.env.NODE_ENV === "production",
};

export default config;
