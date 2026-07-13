import { beforeEach, expect, it } from 'vitest'
import { Bot, Wizard, memoryStorage, session, wizards } from '../src'
import type { Update } from '../src'
import { calls } from './sdk-stub'

const msg = (text: string): Update['message'] => ({
  message_id: 1,
  date: 0,
  text,
  chat: { id: 9, type: 'private' },
  from: { id: 9, is_bot: false, first_name: 'W' },
})

const texts = () => calls.map((c) => c.payload.text)

beforeEach(() => {
  calls.length = 0
})

function signupBot() {
  const signup = new Wizard('signup')
    .step((ctx) => ctx.reply('name?'))
    .step(async (ctx) => {
      ctx.wizard!.data.name = ctx.message!.text
      await ctx.reply('age?')
    })
    .step(async (ctx) => {
      const age = Number(ctx.message!.text)
      if (!Number.isFinite(age)) {
        await ctx.reply('a number, please')
        return ctx.wizard!.stay()
      }
      await ctx.reply(`${ctx.wizard!.data.name}, ${age}. done`)
    })

  const bot = new Bot()
  bot.use(session({ storage: memoryStorage(), initial: () => ({}) }))
  bot.use(wizards(signup))
  bot.command('signup', (ctx) => ctx.wizard!.enter('signup'))
  bot.command('cancel', (ctx) => {
    ctx.wizard!.exit()
    return ctx.reply('cancelled')
  })
  bot.hears(/ping/, (ctx) => ctx.reply('pong'))
  return bot
}

it('walks through a full flow', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('ann'))
  await bot.handle('message', msg('30'))
  expect(texts()).toEqual(['name?', 'age?', 'ann, 30. done'])
})

it('stay() repeats the step on bad input', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('ann'))
  await bot.handle('message', msg('not a number'))
  await bot.handle('message', msg('31'))
  expect(texts()).toEqual(['name?', 'age?', 'a number, please', 'ann, 31. done'])
})

it('finished wizard releases the updates back to the router', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('ann'))
  await bot.handle('message', msg('30'))
  await bot.handle('message', msg('ping'))
  expect(texts().at(-1)).toBe('pong')
})

it('active wizard swallows unrelated handlers', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('ping'))
  // 'ping' was consumed as the name, not routed to hears()
  expect(texts()).toEqual(['name?', 'age?'])
})

it('commands cut through an active wizard', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('/cancel'))
  await bot.handle('message', msg('ping'))
  expect(texts()).toEqual(['name?', 'cancelled', 'pong'])
})

it('cancel mid-flow does not resurrect state', async () => {
  const bot = signupBot()
  await bot.handle('message', msg('/signup'))
  await bot.handle('message', msg('ann'))
  await bot.handle('message', msg('/cancel'))
  await bot.handle('message', msg('55'))
  // '55' is just a message now, nobody handles it
  expect(texts()).toEqual(['name?', 'age?', 'cancelled'])
})

it('enter() on unknown wizard throws', async () => {
  const bot = new Bot()
  bot.use(session({ storage: memoryStorage(), initial: () => ({}) }))
  bot.use(wizards())
  bot.command('go', (ctx) => ctx.wizard!.enter('nope'))
  await expect(bot.handle('message', msg('/go'))).rejects.toThrow('unknown wizard')
})
