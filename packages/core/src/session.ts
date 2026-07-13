import { db } from 'sdk'
import { eq } from 'sdk/db'
import type { Middleware } from './composer'
import type { Context } from './context'

export interface SessionStorage {
  read(key: string): Promise<unknown>
  write(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
}

export interface SessionOptions<S = unknown> {
  storage: SessionStorage
  initial?: () => S
  getSessionKey?: (ctx: Context) => string | undefined
}

const defaultKey = (ctx: Context) => {
  const id = ctx.chat?.id ?? ctx.from?.id
  return id === undefined ? undefined : String(id)
}

export function session<S = unknown>(opts: SessionOptions<S>): Middleware {
  const getKey = opts.getSessionKey ?? defaultKey
  return async (ctx, next) => {
    const key = getKey(ctx)
    if (key === undefined) return next()

    ctx.session = (await opts.storage.read(key)) ?? opts.initial?.()
    await next()
    // no write-back if the handler threw; a half-applied session is worse than a stale one
    if (ctx.session === undefined) await opts.storage.delete(key)
    else await opts.storage.write(key, ctx.session)
  }
}

// backed by a table from your schema.js. expects a plain text key column and a
// plain text data column, e.g.:
//   export const sessions = table('sessions', { key: text('key').primaryKey(), data: text('data') })
// serialization is handled here, so keep the data column mode-less.
export function sqliteStorage(
  sessions: any,
  cols: { key?: string; data?: string } = {},
): SessionStorage {
  const keyProp = cols.key ?? 'key'
  const dataProp = cols.data ?? 'data'
  const keyCol = sessions[keyProp]
  if (!keyCol || !sessions[dataProp]) {
    throw new Error(`sqliteStorage: table has no "${keyProp}"/"${dataProp}" columns`)
  }

  return {
    async read(key) {
      const [row] = await db.select().from(sessions).where(eq(keyCol, key)).limit(1)
      return row ? JSON.parse(row[dataProp]) : undefined
    },
    async write(key, value) {
      const data = JSON.stringify(value)
      // select-then-write instead of upsert: platform's conflict clause support
      // is unknown (TODO-VERIFY), and per-update handlers don't race themselves
      const [row] = await db.select().from(sessions).where(eq(keyCol, key)).limit(1)
      if (row) await db.update(sessions).set({ [dataProp]: data }).where(eq(keyCol, key))
      else await db.insert(sessions).values({ [keyProp]: key, [dataProp]: data })
    },
    async delete(key) {
      await db.delete(sessions).where(eq(keyCol, key))
    },
  }
}

// for unit tests and throwaway state
export function memoryStorage(): SessionStorage {
  const map = new Map<string, string>()
  return {
    async read(key) {
      const v = map.get(key)
      return v === undefined ? undefined : JSON.parse(v)
    },
    async write(key, value) {
      map.set(key, JSON.stringify(value))
    },
    async delete(key) {
      map.delete(key)
    },
  }
}
