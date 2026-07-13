import type BetterSqlite3 from 'better-sqlite3'
import { Column, Table, fromDriver, isTable, toDriver } from './columns'
import type { SqlChunk } from './ops'

// everything is thenable because every query on the platform is async

function mapRow(t: Table, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, col] of Object.entries(t._.columns)) out[key] = fromDriver(col, raw[col.name])
  return out
}

class SelectQuery implements PromiseLike<Record<string, unknown>[]> {
  #sqlite: BetterSqlite3.Database
  #table?: Table
  #where?: SqlChunk
  #limit?: number

  constructor(sqlite: BetterSqlite3.Database) {
    this.#sqlite = sqlite
  }

  from(t: Table): this {
    this.#table = t
    return this
  }

  where(cond: SqlChunk): this {
    this.#where = cond
    return this
  }

  limit(n: number): this {
    this.#limit = n
    return this
  }

  then<R1 = Record<string, unknown>[], R2 = never>(
    onfulfilled?: ((rows: Record<string, unknown>[]) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve()
      .then(() => this.#run())
      .then(onfulfilled, onrejected)
  }

  #run(): Record<string, unknown>[] {
    const t = this.#table
    if (!t) throw new Error('select() without from()')
    let q = `SELECT * FROM "${t._.name}"`
    const params: unknown[] = []
    if (this.#where) {
      q += ` WHERE ${this.#where.sql}`
      params.push(...this.#where.params)
    }
    if (this.#limit !== undefined) q += ` LIMIT ${this.#limit}`
    const rows = this.#sqlite.prepare(q).all(...params) as Record<string, unknown>[]
    return rows.map((r) => mapRow(t, r))
  }
}

class InsertQuery implements PromiseLike<unknown> {
  #sqlite: BetterSqlite3.Database
  #table: Table
  #rows: Record<string, unknown>[] = []

  constructor(sqlite: BetterSqlite3.Database, t: Table) {
    this.#sqlite = sqlite
    this.#table = t
  }

  values(v: Record<string, unknown> | Record<string, unknown>[]): this {
    this.#rows = Array.isArray(v) ? v : [v]
    return this
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: unknown) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve()
      .then(() => this.#run())
      .then(onfulfilled, onrejected)
  }

  #run() {
    if (this.#rows.length === 0) throw new Error('insert() without values()')
    let changes = 0
    let lastInsertRowid: number | bigint = 0
    for (const row of this.#rows) {
      const keys = Object.keys(row)
      const cols = keys.map((k) => this.#col(k))
      const q = `INSERT INTO "${this.#table._.name}" (${cols.map((c) => `"${c.name}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
      const info = this.#sqlite.prepare(q).run(...keys.map((k, i) => toDriver(cols[i], row[k])))
      changes += info.changes
      lastInsertRowid = info.lastInsertRowid
    }
    return { changes, lastInsertRowid }
  }

  #col(key: string): Column {
    const col = this.#table._.columns[key]
    if (!col) throw new Error(`unknown column "${key}" on table "${this.#table._.name}"`)
    return col
  }
}

class UpdateQuery implements PromiseLike<unknown> {
  #sqlite: BetterSqlite3.Database
  #table: Table
  #set?: Record<string, unknown>
  #where?: SqlChunk

  constructor(sqlite: BetterSqlite3.Database, t: Table) {
    this.#sqlite = sqlite
    this.#table = t
  }

  set(values: Record<string, unknown>): this {
    this.#set = values
    return this
  }

  where(cond: SqlChunk): this {
    this.#where = cond
    return this
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: unknown) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve()
      .then(() => this.#run())
      .then(onfulfilled, onrejected)
  }

  #run() {
    if (!this.#set) throw new Error('update() without set()')
    const keys = Object.keys(this.#set)
    const cols = keys.map((k) => {
      const col = this.#table._.columns[k]
      if (!col) throw new Error(`unknown column "${k}" on table "${this.#table._.name}"`)
      return col
    })
    let q = `UPDATE "${this.#table._.name}" SET ${cols.map((c) => `"${c.name}" = ?`).join(', ')}`
    const params = keys.map((k, i) => toDriver(cols[i], this.#set![k]))
    if (this.#where) {
      q += ` WHERE ${this.#where.sql}`
      params.push(...this.#where.params)
    }
    return this.#sqlite.prepare(q).run(...params)
  }
}

class DeleteQuery implements PromiseLike<unknown> {
  #sqlite: BetterSqlite3.Database
  #table: Table
  #where?: SqlChunk

  constructor(sqlite: BetterSqlite3.Database, t: Table) {
    this.#sqlite = sqlite
    this.#table = t
  }

  where(cond: SqlChunk): this {
    this.#where = cond
    return this
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: unknown) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve()
      .then(() => this.#run())
      .then(onfulfilled, onrejected)
  }

  #run() {
    let q = `DELETE FROM "${this.#table._.name}"`
    const params: unknown[] = []
    if (this.#where) {
      q += ` WHERE ${this.#where.sql}`
      params.push(...this.#where.params)
    }
    return this.#sqlite.prepare(q).run(...params)
  }
}

export function makeDb(sqlite: BetterSqlite3.Database) {
  return {
    select: () => new SelectQuery(sqlite),
    insert: (t: Table) => new InsertQuery(sqlite, t),
    update: (t: Table) => new UpdateQuery(sqlite, t),
    delete: (t: Table) => new DeleteQuery(sqlite, t),
    // escape hatches for raw sql`` chunks
    run: async (c: SqlChunk) => sqlite.prepare(c.sql).run(...c.params),
    all: async (c: SqlChunk) => sqlite.prepare(c.sql).all(...c.params),
    get: async (c: SqlChunk) => sqlite.prepare(c.sql).get(...c.params),
  }
}

export type Db = ReturnType<typeof makeDb>

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

// no FOREIGN KEY clauses on purpose: the platform keeps FKs off,
// referential integrity is the bot's problem
export function createTables(sqlite: BetterSqlite3.Database, schema: Record<string, unknown>) {
  for (const t of Object.values(schema)) {
    if (!isTable(t)) continue
    const cols = Object.values(t._.columns).map((col) => {
      let s = `"${col.name}" ${col.sqlType}`
      if (col.isPk) s += ' PRIMARY KEY'
      if (col.isNotNull) s += ' NOT NULL'
      if (col.hasDefault) s += ` DEFAULT ${sqlLiteral(toDriver(col, col.defaultValue))}`
      return s
    })
    sqlite.exec(`CREATE TABLE IF NOT EXISTS "${t._.name}" (${cols.join(', ')})`)
  }
}
