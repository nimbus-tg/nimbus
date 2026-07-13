import { Bot } from 'lib/_vendor/nimbus'
import { db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from 'schema'

const bot = new Bot()

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

bot.hears(/^ping$/i, (ctx) => ctx.reply('pong'))

export default bot
