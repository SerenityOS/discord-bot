This is the source to the discord bot that lives in the SerenityOS Discord.

### Setup

The bot is written in type script, so you'll need to install `nodejs` and `yarn`.

Then setup your environment:

```
$ git clone https://github.com/SerenityOS/discord-bot
$ cd discord-bot
$ yarn
```

Eventually I'd like to create a crate.

### Configuration

To configure the bot for local development you simply need to drop your discord bot token in an `.env` file at the root of this project.
See: https://www.writebots.com/discord-bot-token/

Now you can run `nodemon` and bot will startup, and then restart as you save changes to the source files:
```
$ nodemon
[nodemon] 2.0.7 
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: ts,js
[nodemon] starting `ts-node ./src/index.ts`
Buggie bot has started     
```

### Running tests

There are no tests yet! Please help me add some!

### Credits

This was originally based off of the following discord bot template: https://github.com/MidasXIV/hive-greeter

