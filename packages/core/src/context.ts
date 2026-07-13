import { api } from 'sdk'
import type { CallbackQuery, Chat, Message, Update, User } from './types'

// The platform hands each handler an unpacked payload plus a ctx whose only
// documented field is the raw update. TODO-VERIFY: what else lives on it.
export interface RawCtx {
  update?: Update
  [key: string]: unknown
}

export class Context {
  readonly updateType: string
  readonly payload: unknown
  readonly raw: RawCtx
  readonly update: Update
  match: RegExpMatchArray | string | null = null
  session?: unknown

  constructor(updateType: string, payload: unknown, raw: RawCtx = {}) {
    this.updateType = updateType
    this.payload = payload
    this.raw = raw
    this.update = raw.update ?? ({ update_id: 0, [updateType]: payload } as Update)
  }

  get api() {
    return api
  }

  get message(): Message | undefined {
    return this.update.message
  }

  get callbackQuery(): CallbackQuery | undefined {
    return this.update.callback_query
  }

  get msg(): Message | undefined {
    return (
      this.update.message ??
      this.update.edited_message ??
      this.update.channel_post ??
      this.callbackQuery?.message
    )
  }

  get chat(): Chat | undefined {
    return this.msg?.chat
  }

  get from(): User | undefined {
    return this.callbackQuery?.from ?? (this.update.inline_query as { from?: User } | undefined)?.from ?? this.msg?.from
  }

  reply(text: string, extra: Record<string, unknown> = {}): Promise<Message> {
    const chat = this.chat
    if (!chat) throw new Error('reply(): no chat in this update')
    return api.sendMessage!({ chat_id: chat.id, text, ...extra }) as Promise<Message>
  }
}
