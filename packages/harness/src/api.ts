// TODO-VERIFY: constructor shape and message format inferred from docs
export class BotApiError extends Error {
  method: string
  code: number
  description: string
  parameters?: Record<string, unknown>

  constructor(method: string, code: number, description: string, parameters?: Record<string, unknown>) {
    super(`${method} failed: ${code} ${description}`)
    this.name = 'BotApiError'
    this.method = method
    this.code = code
    this.description = description
    this.parameters = parameters
  }
}

export interface ApiCall {
  method: string
  payload: Record<string, unknown>
}

type Responder = (payload: Record<string, unknown>) => unknown

export class MockApi {
  calls: ApiCall[] = []
  #responders = new Map<string, Responder>()
  #msgId = 1000

  // payloads of recorded calls, optionally filtered by method
  sent(method?: string): Record<string, unknown>[] {
    const calls = method ? this.calls.filter((c) => c.method === method) : this.calls
    return calls.map((c) => c.payload)
  }

  respondTo(method: string, fn: Responder): this {
    this.#responders.set(method, fn)
    return this
  }

  failWith(method: string, code: number, description: string): this {
    return this.respondTo(method, () => {
      throw new BotApiError(method, code, description)
    })
  }

  async dispatch(method: string, payload: Record<string, unknown> = {}): Promise<unknown> {
    this.calls.push({ method, payload })
    const responder = this.#responders.get(method)
    if (responder) return responder(payload)
    return this.#defaultResult(method, payload)
  }

  #defaultResult(method: string, payload: Record<string, unknown>): unknown {
    switch (method) {
      case 'sendMessage':
      case 'editMessageText':
        return {
          message_id: this.#msgId++,
          date: Math.floor(Date.now() / 1000),
          chat: { id: payload.chat_id, type: 'private' },
          text: payload.text,
        }
      default:
        return true
    }
  }
}
