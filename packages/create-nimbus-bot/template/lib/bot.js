import { Bot } from 'lib/_vendor/nimbus'
import { db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from 'schema'

const bot = new Bot()

bot.command('start', async (ctx) => {
  const [known] = await db.select().from(users).where(eq(users.id, ctx.from.id))
  if (!known) {
    await db.insert(users).values({
      id: ctx.from.id,
      name: ctx.from.first_name,
      firstSeen: new Date(),
    })
  }
  await ctx.reply(known ? `welcome back, ${ctx.from.first_name}` : `hi ${ctx.from.first_name}`)
})

bot.hears(/^ping$/i, (ctx) => ctx.reply('pong'))

export default bot
