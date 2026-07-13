export interface User {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface Chat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
}

export interface Message {
  message_id: number
  date: number
  chat: Chat
  from?: User
  text?: string
  reply_to_message?: Message
  [key: string]: unknown
}

export interface CallbackQuery {
  id: string
  from: User
  message?: Message
  data?: string
  [key: string]: unknown
}

export interface Update {
  update_id: number
  message?: Message
  edited_message?: Message
  channel_post?: Message
  callback_query?: CallbackQuery
  [key: string]: unknown
}

export type UpdateType =
  | 'message'
  | 'edited_message'
  | 'channel_post'
  | 'callback_query'
  | 'inline_query'
  | (string & {})
