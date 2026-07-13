import { expect, it } from 'vitest'
import { InlineKeyboard, Keyboard, removeKeyboard } from '../src'

it('inline keyboard builds rows', () => {
  const kb = new InlineKeyboard()
    .text('a', 'cb-a')
    .text('b')
    .row()
    .url('site', 'https://example.com')

  expect(JSON.parse(JSON.stringify(kb))).toEqual({
    inline_keyboard: [
      [
        { text: 'a', callback_data: 'cb-a' },
        { text: 'b', callback_data: 'b' },
      ],
      [{ text: 'site', url: 'https://example.com' }],
    ],
  })
})

it('row() is idempotent on empty rows', () => {
  const kb = new InlineKeyboard().row().row().text('x').row().row()
  expect(kb.inline_keyboard).toHaveLength(1)
})

it('reply keyboard with options', () => {
  const kb = new Keyboard().text('yes').text('no').row().requestContact('share').resized().oneTime()
  const json = JSON.parse(JSON.stringify(kb))
  expect(json.keyboard).toEqual([
    [{ text: 'yes' }, { text: 'no' }],
    [{ text: 'share', request_contact: true }],
  ])
  expect(json.resize_keyboard).toBe(true)
  expect(json.one_time_keyboard).toBe(true)
})

it('removeKeyboard shape', () => {
  expect(removeKeyboard).toEqual({ remove_keyboard: true })
})
