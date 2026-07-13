# nimbus

Framework and local test harness for Telegram BotCloud (the serverless bot platform).

Status: pre-alpha. The platform itself is invite-only and its docs are incomplete, so
parts of this are built against assumptions -- grep for `TODO-VERIFY` before trusting
anything platform-facing.

## Why

BotCloud gives you V8 isolates, a per-bot SQLite database and the Bot API client.
No Node, no npm at runtime, no local emulator, no scheduler. You write one file per
update type in `handlers/` and push. That's it.

nimbus adds the two things you actually miss on day one:

- a real router with middleware (`@nimbus-tg/core`), grammY-flavored API, that compiles
  down to plain JS vendored into your project -- because there is no package registry
  at runtime
- an offline emulation of the `sdk` / `sdk/db` modules (`@nimbus-tg/harness`) so your
  bot is unit-testable in CI without touching Telegram or the platform at all

Not a grammY/Telegraf fork. The runtime constraints are different enough that sharing
code doesn't work; we only borrow the ergonomics.

## Quick look

```js
// lib/bot.js
import { Bot } from 'lib/_vendor/nimbus'
import { db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from 'schema'

const bot = new Bot()

bot.command('start', async (ctx) => {
  const [seen] = await db.select().from(users).where(eq(users.id, ctx.from.id))
  await ctx.reply(seen ? 'welcome back' : 'hi')
})

bot.hears(/^ping$/i, (ctx) => ctx.reply('pong'))

export default bot
```

```
$ nimbus vendor
vendored runtime -> lib/_vendor/nimbus.js
handlers: message
$ npx tgcloud push
```

`nimbus vendor` copies the framework (a single self-contained ESM file, zero imports
except `sdk`/`sdk/db`) into `lib/_vendor/` and generates a thin shim in `handlers/`
for every update type your bot subscribes to. The generated files are throwaway,
gitignore them and re-run vendor whenever the bot changes shape.

Testing, no network involved:

```js
import { createHarness, updates } from '@nimbus-tg/harness'
import * as schema from '../schema.js'
import handler from '../handlers/message.js'

const h = createHarness({ schema })
await h.dispatch(handler, updates.message('/start'))

expect(h.api.sent('sendMessage')[0].text).toBe('hi')
const rows = await h.db.select().from(schema.users)
```

See [examples/hello-bot](examples/hello-bot) for the full setup including the vitest
config glue (`botProject()` teaches vitest the platform's bare-import scheme).

## Packages

| package | what |
| --- | --- |
| `@nimbus-tg/core` | Bot/Composer/Context runtime + `nimbus vendor` CLI |
| `@nimbus-tg/harness` | `sdk` and `sdk/db` reimplemented over better-sqlite3, recorded mock Bot API, update factories |

Both are dev dependencies. Nothing from npm ever runs on the platform; the vendored
`lib/_vendor/nimbus.js` is the only framework code that ships.

## What works today

- router: `bot.command()`, `bot.hears()`, `bot.on('callback_query')` /
  `bot.on('message:text')`, koa-style `use()` middleware, `bot.catch()`
- ctx: `reply()`, `answerCallbackQuery()`, `api`, `update`, `from`, `chat`, `match`,
  `session`
- sessions: `session()` middleware with pluggable storage; `sqliteStorage(table)` keeps
  state in your own schema table, `memoryStorage()` for tests
- `InlineKeyboard` / `Keyboard` builders, drop them into `reply_markup` directly
- vendor pipeline: prebuilt runtime copy + handler shim generation from the route table
- harness: query builder (select/insert/update/delete, eq/and/or/like/inArray, column
  modes timestamp/boolean/json), recorded api with overridable responses, text-only
  fetch mock

## Not yet

- conversations/wizard flows, i18n (next milestones)
- joins, upsert, order by in the harness query builder
- running handlers in an actual V8 sandbox (harness is in-process for now)
- file upload/download -- the platform itself doesn't support it
- any kind of scheduler -- ditto

## Things we assume but have not verified on the live runtime

The docs are thin. Everything below is marked `TODO-VERIFY` in code:

- exact export surface of `sdk` / `sdk/db`
- whether nested bare imports like `lib/_vendor/nimbus` resolve (if not, vendoring
  falls back to a flat `lib/` layout, the CLI already owns the layout so this is cheap)
- timestamp column storage unit (we assume ms)
- `BotApiError` constructor shape
- isolate limits: memory, wall time, whether `crypto`/`TextEncoder` exist
- migration classifier behavior, FK-off confirmation

If you have platform access and can check any of these, please open an issue.

## Development

```
pnpm install
pnpm build          # core + harness
pnpm vendor:example # regenerate example's handlers/ + lib/_vendor/
pnpm test
```

Tests must run after build: the example resolves the harness via package exports.

## License

MIT
