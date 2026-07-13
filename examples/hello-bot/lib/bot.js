import { Bot, InlineKeyboard, Wizard, session, sqliteStorage, wizards } from 'lib/_vendor/nimbus'
import { db } from 'sdk'
import { eq } from 'sdk/db'
import { users, sessions } from 'schema'

const bot = new Bot()

bot.use(session({ storage: sqliteStorage(sessions), initial: () => ({ clicks: 0 }) }))

const rename = new Wizard('rename')
  .step((ctx) => ctx.reply('what should i call you?'))
  .step(async (ctx) => {
    const name = ctx.message.text
    const [row] = await db.select().from(users).where(eq(users.id, ctx.from.id))
    if (row) await db.update(users).set({ name }).where(eq(users.id, ctx.from.id))
    else await db.insert(users).values({ id: ctx.from.id, name, greets: 0, firstSeen: new Date() })
    await ctx.reply(`got it, ${name}`)
  })

bot.use(wizards(rename))
bot.command('rename', (ctx) => ctx.wizard.enter('rename'))

bot.command('start', async (ctx) => {
  const [seen] = await db.select().from(users).where(eq(users.id, ctx.from.id))
  if (seen) {
    await db.update(users).set({ greets: seen.greets + 1 }).where(eq(users.id, seen.id))
    await ctx.reply(`welcome back, ${ctx.from.first_name}! visit #${seen.greets + 1}`)
    return
  }
  await db.insert(users).values({
    id: ctx.from.id,
    name: ctx.from.first_name,
    greets: 1,
    firstSeen: new Date(),
  })
  await ctx.reply(`hi ${ctx.from.first_name}`)
})

bot.command('menu', (ctx) =>
  ctx.reply('pick one', {
    reply_markup: new InlineKeyboard().text('click me', 'click').row().url('source', 'https://github.com/nimbus-tg/nimbus'),
  }),
)

bot.on('callback_query:data', async (ctx) => {
  if (ctx.callbackQuery.data !== 'click') return
  ctx.session.clicks++
  await ctx.answerCallbackQuery({ text: `${ctx.session.clicks} so far` })
})

bot.hears(/^ping$/i, (ctx) => ctx.reply('pong'))

export default bot
