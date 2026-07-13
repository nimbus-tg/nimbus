import { beforeEach, expect, it } from 'vitest'
import { createHarness, updates } from '@nimbus-tg/harness'
import * as schema from '../schema.js'
import handler from '../handlers/message.js'

let h
beforeEach(() => {
  h = createHarness({ schema })
})

it('greets and remembers the user', async () => {
  await h.dispatch(handler, updates.message('/start'))
  await h.dispatch(handler, updates.message('/start'))

  const texts = h.api.sent('sendMessage').map((p) => p.text)
  expect(texts).toEqual(['hi Tess', 'welcome back, Tess'])

  const rows = await h.db.select().from(schema.users)
  expect(rows).toHaveLength(1)
})

it('answers ping', async () => {
  await h.dispatch(handler, updates.message('ping'))
  expect(h.api.sent('sendMessage')[0].text).toBe('pong')
})
