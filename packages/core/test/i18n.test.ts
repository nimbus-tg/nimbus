import { beforeEach, expect, it } from 'vitest'
import { Bot, i18n, memoryStorage, session } from '../src'
import type { Update } from '../src'
import { calls } from './sdk-stub'

const msg = (text: string, language_code?: string): Update['message'] => ({
  message_id: 1,
  date: 0,
  text,
  chat: { id: 3, type: 'private' },
  from: { id: 3, is_bot: false, first_name: 'L', language_code },
})

const dicts = {
  en: { greet: 'hi {name}', bye: 'bye' },
  ru: { greet: 'привет, {name}' },
}

beforeEach(() => {
  calls.length = 0
})

function bot() {
  const b = new Bot()
  b.use(i18n(dicts, { fallback: 'en' }))
  b.command('start', (ctx) => ctx.reply(ctx.t!('greet', { name: ctx.from!.first_name })))
  b.command('bye', (ctx) => ctx.reply(ctx.t!('bye')))
  b.command('missing', (ctx) => ctx.reply(ctx.t!('no.such.key')))
  return b
}

it('picks locale from language_code, normalizes ru-RU', async () => {
  const b = bot()
  await b.handle('message', msg('/start', 'ru-RU'))
  expect(calls[0]!.payload.text).toBe('привет, L')
})

it('falls back per key', async () => {
  const b = bot()
  await b.handle('message', msg('/bye', 'ru'))
  expect(calls[0]!.payload.text).toBe('bye')
})

it('unknown locale uses fallback, unknown key echoes the key', async () => {
  const b = bot()
  await b.handle('message', msg('/start', 'kk'))
  expect(calls[0]!.payload.text).toBe('hi L')
  await b.handle('message', msg('/missing', 'kk'))
  expect(calls[1]!.payload.text).toBe('no.such.key')
})

it('session locale beats language_code', async () => {
  const b = new Bot()
  b.use(session({ storage: memoryStorage(), initial: () => ({ locale: 'ru' }) }))
  b.use(i18n(dicts, { fallback: 'en' }))
  b.command('start', (ctx) => ctx.reply(ctx.t!('greet', { name: 'x' })))
  await b.handle('message', msg('/start', 'en'))
  expect(calls[0]!.payload.text).toBe('привет, x')
})

it('leaves unknown {vars} untouched', async () => {
  const b = bot()
  await b.handle('message', msg('/start', 'en'))
  expect(calls[0]!.payload.text).toBe('hi L')
})
