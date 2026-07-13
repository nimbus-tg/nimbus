export const calls: { method: string; payload: Record<string, unknown> }[] = []

export const api: any = new Proxy(
  {},
  {
    get: (_, method) => (payload: Record<string, unknown> = {}) => {
      calls.push({ method: String(method), payload })
      return Promise.resolve({ message_id: calls.length })
    },
  },
)

export class BotApiError extends Error {}
export const db: any = null
export const fetch: any = null
