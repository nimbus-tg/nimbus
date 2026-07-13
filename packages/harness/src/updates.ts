// just enough of an Update to drive handlers in tests. override anything via `over`.
let seq = 1

interface Over {
  from?: Record<string, unknown>
  chat?: Record<string, unknown>
  [key: string]: unknown
}

const defaultFrom = (over?: Record<string, unknown>) => ({
  id: 10,
  is_bot: false,
  first_name: 'Tess',
  username: 'tess',
  ...over,
})

export const updates = {
  message(text: string, over: Over = {}) {
    const from = defaultFrom(over.from)
    const chat = { id: from.id, type: 'private', ...over.chat }
    return {
      update_id: seq++,
      message: {
        message_id: seq++,
        date: Math.floor(Date.now() / 1000),
        text,
        from,
        chat,
        ...over.message as object,
      },
    }
  },

  callbackQuery(data: string, over: Over = {}) {
    const from = defaultFrom(over.from)
    return {
      update_id: seq++,
      callback_query: {
        id: String(seq++),
        from,
        chat_instance: '1',
        data,
        ...over,
      },
    }
  },
}
