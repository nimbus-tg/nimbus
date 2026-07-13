# my nimbus bot

A Telegram BotCloud bot built with [nimbus](https://github.com/nimbus-tg/nimbus).

```
npm install
npm test           # offline, no telegram involved
```

Bot logic lives in `lib/bot.js`, tables in `schema.js`. Tests run against a local
emulation of the platform (sqlite + recorded bot api), see `test/bot.test.js`.

Deploying (needs BotCloud access):

```
npx nimbus vendor  # regenerates handlers/ and lib/_vendor/
npx tgcloud push
```

Re-run vendor whenever you subscribe to new update types.
