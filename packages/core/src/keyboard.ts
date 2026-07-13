type Button = Record<string, unknown>

// both builders serialize straight into reply_markup:
// ctx.reply('hi', { reply_markup: new InlineKeyboard().text('a', 'cb-a') })

export class InlineKeyboard {
  inline_keyboard: Button[][] = []
  #break = false

  #add(btn: Button): this {
    if (this.inline_keyboard.length === 0 || this.#break) {
      this.inline_keyboard.push([])
      this.#break = false
    }
    this.inline_keyboard[this.inline_keyboard.length - 1]!.push(btn)
    return this
  }

  text(text: string, callback_data: string = text): this {
    return this.#add({ text, callback_data })
  }

  url(text: string, url: string): this {
    return this.#add({ text, url })
  }

  switchInline(text: string, query = ''): this {
    return this.#add({ text, switch_inline_query: query })
  }

  row(): this {
    this.#break = true
    return this
  }
}

export class Keyboard {
  keyboard: Button[][] = []
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  input_field_placeholder?: string
  #break = false

  #add(btn: Button): this {
    if (this.keyboard.length === 0 || this.#break) {
      this.keyboard.push([])
      this.#break = false
    }
    this.keyboard[this.keyboard.length - 1]!.push(btn)
    return this
  }

  text(text: string): this {
    return this.#add({ text })
  }

  requestContact(text: string): this {
    return this.#add({ text, request_contact: true })
  }

  requestLocation(text: string): this {
    return this.#add({ text, request_location: true })
  }

  row(): this {
    this.#break = true
    return this
  }

  resized(value = true): this {
    this.resize_keyboard = value
    return this
  }

  oneTime(value = true): this {
    this.one_time_keyboard = value
    return this
  }

  placeholder(text: string): this {
    this.input_field_placeholder = text
    return this
  }
}

export const removeKeyboard = { remove_keyboard: true } as const
