import { beforeEach, expect, it } from 'vitest'
import { createHarness, updates } from '@nimbus-tg/harness'
import * as schema from '../schema.js'
import handler from '../handlers/message.js'

let h
beforeEach(() => {
  h = createHarness({ schema })
})

it('greets a new user and stores them', async () => {
  await h.dispatch(handler, updates.message('/start'))

  expect(h.api.sent('sendMessage')).toEqual([
    expect.objectContaining({ chat_id: 10, text: 'hi Tess' }),
  ])

  const [row] = await h.db.select().from(schema.users)
  expect(row).toMatchObject({ id: 10, name: 'Tess', greets: 1 })
  expect(row.firstSeen).toBeInstanceOf(Date)
})

it('counts repeat visits', async () => {
  await h.dispatch(handler, updates.message('/start'))
  await h.dispatch(handler, updates.message('/start'))

  const texts = h.api.sent('sendMessage').map((p) => p.text)
  expect(texts[1]).toBe('welcome back, Tess! visit #2')

  const [row] = await h.db.select().from(schema.users)
  expect(row.greets).toBe(2)
})

it('answers ping', async () => {
  await h.dispatch(handler, updates.message('ping'))
  expect(h.api.sent('sendMessage')[0].text).toBe('pong')
})

it('stays silent on anything else', async () => {
  await h.dispatch(handler, updates.message('what is this'))
  expect(h.api.calls).toHaveLength(0)
})
