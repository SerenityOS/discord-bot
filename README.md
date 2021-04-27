This is the source for the SerenityOS Discord Bot.

### Setup

The bot is written in [TypeScript](https://www.typescriptlang.org), `nodejs` and `yarn` are pre-requisites.

Then setup your environment:

```
$ git clone https://github.com/SerenityOS/discord-bot
$ cd discord-bot
$ yarn install
$ yarn build
```

Eventually I'd like to create a crate.

### Configuration

To configure the bot for local development you simply need to drop your discord bot token in an `.env` file at the root of this project.
See: https://www.writebots.com/discord-bot-token/

Now you can run `yarn start:dev` and the bot will startup, and then restart as you save changes to the source files:
```
$ yarn start:dev
[nodemon] 2.0.7 
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: ts,js
[nodemon] starting `ts-node ./src/index.ts`
Buggie bot has started
```

### Running Tests

There are no tests yet, please help add some.

### Credits

This was originally based off of the following discord bot template: https://github.com/MidasXIV/hive-greeter

