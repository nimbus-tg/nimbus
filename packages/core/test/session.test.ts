import { expect, it } from 'vitest'
import { Bot, memoryStorage, session } from '../src'
import type { Update } from '../src'

const msg = (text: string, userId = 7): Update['message'] => ({
  message_id: 1,
  date: 0,
  text,
  chat: { id: userId, type: 'private' },
  from: { id: userId, is_bot: false, first_name: 'S' },
})

it('persists session between updates', async () => {
  const bot = new Bot()
  bot.use(session({ storage: memoryStorage(), initial: () => ({ n: 0 }) }))
  const seen: number[] = []
  bot.command('inc', (ctx) => {
    const s = ctx.session as { n: number }
    s.n++
    seen.push(s.n)
  })

  await bot.handle('message', msg('/inc'))
  await bot.handle('message', msg('/inc'))
  await bot.handle('message', msg('/inc'))
  expect(seen).toEqual([1, 2, 3])
})

it('keys sessions by chat', async () => {
  const bot = new Bot()
  bot.use(session({ storage: memoryStorage(), initial: () => ({ n: 0 }) }))
  const seen: number[] = []
  bot.command('inc', (ctx) => {
    const s = ctx.session as { n: number }
    seen.push(++s.n)
  })

  await bot.handle('message', msg('/inc', 1))
  await bot.handle('message', msg('/inc', 2))
  await bot.handle('message', msg('/inc', 1))
  expect(seen).toEqual([1, 1, 2])
})

it('setting session to undefined deletes it', async () => {
  const storage = memoryStorage()
  const bot = new Bot()
  bot.use(session({ storage, initial: () => ({ n: 0 }) }))
  bot.command('reset', (ctx) => {
    ctx.session = undefined
  })

  await bot.handle('message', msg('/reset'))
  expect(await storage.read('7')).toBeUndefined()
})

it('skips write-back when the handler throws', async () => {
  const storage = memoryStorage()
  await storage.write('7', { n: 5 })
  const bot = new Bot()
  bot.catch(() => {})
  bot.use(session({ storage }))
  bot.command('boom', (ctx) => {
    ;(ctx.session as { n: number }).n = 999
    throw new Error('nope')
  })

  await bot.handle('message', msg('/boom'))
  expect(await storage.read('7')).toEqual({ n: 5 })
})
