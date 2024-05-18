This is the source for the SerenityOS Discord Bot.

### Setup

The bot is written in [TypeScript](https://www.typescriptlang.org), `nodejs` and `pnpm` are pre-requisites.

Then setup your environment:

```
$ git clone https://github.com/SerenityOS/discord-bot
$ cd discord-bot
$ pnpm install
$ pnpm build
```

### Configuration

To configure the bot for local development you simply need to drop your discord bot token and guild ID in an `.env` file at the root of this project.
The contents should look something like:
```ini
discord_token=<your-token-goes-here>
guild_id=<your-guild-id-goes-here>
```
See: https://www.writebots.com/discord-bot-token/

Now you can run `pnpm start:dev` and the bot will startup, and then restart as you save changes to the source files.

### Running Tests

There are no tests yet, please help add some.

### Credits

This was originally based off of the following discord bot template: https://github.com/MidasXIV/hive-greeter

