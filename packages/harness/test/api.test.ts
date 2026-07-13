import { expect, it } from 'vitest'
import { createHarness, BotApiError } from '../src'
import { api, fetch as sdkFetch } from '../src/sdk'

it('records calls and returns a fake message', async () => {
  const h = createHarness()
  const res = await api.sendMessage({ chat_id: 5, text: 'hey' })
  expect(res.text).toBe('hey')
  expect(h.api.sent('sendMessage')).toEqual([{ chat_id: 5, text: 'hey' }])
})

it('respondTo overrides, failWith throws BotApiError', async () => {
  const h = createHarness()
  h.api.respondTo('getChat', () => ({ id: 5, type: 'private', title: 'x' }))
  expect(await api.getChat({ chat_id: 5 })).toMatchObject({ id: 5 })

  h.api.failWith('sendMessage', 429, 'Too Many Requests: retry after 3')
  await expect(api.sendMessage({ chat_id: 5, text: 'x' })).rejects.toThrow(BotApiError)
})

it('fetch mock serves text and records requests', async () => {
  const h = createHarness()
  h.fetch.on('https://example.com/rate', '{"usd": 92.4}')

  const res = await sdkFetch('https://example.com/rate?base=rub')
  expect(res.status).toBe(200)
  expect(await res.text()).toContain('92.4')
  expect(h.fetch.requests[0]!.url).toContain('base=rub')
})

it('unmocked fetch fails loudly', async () => {
  createHarness()
  await expect(sdkFetch('https://nope.dev')).rejects.toThrow(/no mock/)
})
