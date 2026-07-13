import Database from 'better-sqlite3'
import { MockApi } from './api'
import { createTables, makeDb, type Db } from './database'
import { MockFetch } from './fetch'
import { activate } from './state'

export interface Harness {
  api: MockApi
  db: Db
  fetch: MockFetch
  sqlite: Database.Database
  dispatch(handler: (payload: any, ctx: any) => unknown, update: Record<string, unknown>): Promise<unknown>
  close(): void
}

export function createHarness(opts: { schema?: Record<string, unknown> } = {}): Harness {
  const sqlite = new Database(':memory:')
  if (opts.schema) createTables(sqlite, opts.schema)

  const api = new MockApi()
  const fetch = new MockFetch()
  const db = makeDb(sqlite)

  activate({ api, db, fetch: fetch.handler() })

  return {
    api,
    db,
    fetch,
    sqlite,
    // mimic platform dispatch: handler gets the unpacked payload plus a ctx
    // carrying the raw update
    async dispatch(handler, update) {
      const type = Object.keys(update).find((k) => k !== 'update_id')
      if (!type) throw new Error('update has no payload')
      return handler(update[type], { update })
    },
    close() {
      sqlite.close()
    },
  }
}
