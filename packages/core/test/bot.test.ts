import { beforeEach, expect, it } from 'vitest'
import { Bot } from '../src'
import type { Update } from '../src'
import { calls } from './sdk-stub'

const msg = (text: string): Update['message'] => ({
  message_id: 1,
  date: 0,
  text,
  chat: { id: 42, type: 'private' },
  from: { id: 42, is_bot: false, first_name: 'Ann' },
})

beforeEach(() => {
  calls.length = 0
})

it('routes commands and captures args in ctx.match', async () => {
  const bot = new Bot()
  const hits: string[] = []
  bot.command('start', (ctx) => {
    hits.push(`start:${ctx.match}`)
  })
  bot.command('help', () => {
    hits.push('help')
  })

  await bot.handle('message', msg('/start deep link'))
  await bot.handle('message', msg('/help'))
  await bot.handle('message', msg('/unknown'))

  expect(hits).toEqual(['start:deep link', 'help'])
})

it('matches /cmd@BotName', async () => {
  const bot = new Bot()
  let hit = false
  bot.command('start', () => {
    hit = true
  })
  await bot.handle('message', msg('/start@SomeBot'))
  expect(hit).toBe(true)
})

it('hears sets regex match', async () => {
  const bot = new Bot()
  let got: RegExpMatchArray | string | null = null
  bot.hears(/order (\d+)/, (ctx) => {
    got = ctx.match
  })
  await bot.handle('message', msg('order 137 please'))
  expect(got![1]).toBe('137')
})

it('runs middleware in order, filters do not swallow next()', async () => {
  const bot = new Bot()
  const order: string[] = []
  bot.use(async (_ctx, next) => {
    order.push('pre')
    await next()
    order.push('post')
  })
  bot.command('nope', () => order.push('nope'))
  bot.hears(/hello/, () => order.push('hears'))

  await bot.handle('message', msg('hello there'))
  expect(order).toEqual(['pre', 'hears', 'post'])
})

it('on() filters by update type', async () => {
  const bot = new Bot()
  const seen: string[] = []
  bot.on('callback_query', (ctx) => {
    seen.push((ctx.payload as { data: string }).data)
  })
  bot.command('x', () => seen.push('cmd'))

  await bot.handle('callback_query', { id: '1', from: { id: 1, is_bot: false, first_name: 'A' }, data: 'clicked' })
  expect(seen).toEqual(['clicked'])
})

it('on() with field filter', async () => {
  const bot = new Bot()
  const seen: string[] = []
  bot.on('message:photo', () => seen.push('photo'))
  bot.on('message:text', () => seen.push('text'))

  await bot.handle('message', msg('hello'))
  expect(seen).toEqual(['text'])
  expect(bot.updateTypes()).toEqual(['message'])
})

it('updateTypes reflects registrations', () => {
  const bot = new Bot()
  bot.command('start', () => {})
  bot.on('callback_query', () => {})
  bot.on('edited_message', () => {})
  expect(bot.updateTypes()).toEqual(['callback_query', 'edited_message', 'message'])
})

it('ctx.reply goes through api.sendMessage', async () => {
  const bot = new Bot()
  bot.command('hi', (ctx) => ctx.reply('yo', { parse_mode: 'HTML' }))
  await bot.handle('message', msg('/hi'))
  expect(calls).toEqual([
    { method: 'sendMessage', payload: { chat_id: 42, text: 'yo', parse_mode: 'HTML' } },
  ])
})

it('catch() intercepts handler errors', async () => {
  const bot = new Bot()
  let caught: unknown
  bot.catch((err) => {
    caught = err
  })
  bot.command('boom', () => {
    throw new Error('kaboom')
  })
  await bot.handle('message', msg('/boom'))
  expect((caught as Error).message).toBe('kaboom')
})

it('rethrows without catch()', async () => {
  const bot = new Bot()
  bot.command('boom', () => {
    throw new Error('kaboom')
  })
  await expect(bot.handle('message', msg('/boom'))).rejects.toThrow('kaboom')
})
