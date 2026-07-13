// what user code sees when it does `import { db, api, fetch, BotApiError } from 'sdk'`
// under the harness. everything routes to the currently active harness.
import { active } from './state'

export const api: any = new Proxy(
  {},
  {
    get: (_, method) => {
      if (typeof method !== 'string') return undefined
      return (payload?: Record<string, unknown>) => active().api.dispatch(method, payload)
    },
  },
)

export const db: any = new Proxy(
  {},
  {
    get: (_, prop) => active().db[prop],
  },
)

export const fetch = (url: string, init?: Record<string, unknown>) => active().fetch(url, init)

export { BotApiError } from './api'
