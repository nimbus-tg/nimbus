type Mode = 'timestamp' | 'boolean' | 'json'

export class Column {
  readonly name: string
  readonly sqlType: string
  readonly mode?: Mode
  isPk = false
  isNotNull = false
  hasDefault = false
  defaultValue: unknown

  constructor(name: string, sqlType: string, mode?: Mode) {
    this.name = name
    this.sqlType = sqlType
    this.mode = mode
  }

  primaryKey(): this {
    this.isPk = true
    return this
  }

  notNull(): this {
    this.isNotNull = true
    return this
  }

  default(value: unknown): this {
    this.hasDefault = true
    this.defaultValue = value
    return this
  }
}

export const text = (name: string, opts?: { mode?: 'json' }) => new Column(name, 'TEXT', opts?.mode)
export const integer = (name: string, opts?: { mode?: 'timestamp' | 'boolean' }) =>
  new Column(name, 'INTEGER', opts?.mode)
export const real = (name: string) => new Column(name, 'REAL')
export const numeric = (name: string) => new Column(name, 'NUMERIC')
export const blob = (name: string) => new Column(name, 'BLOB')
// TODO-VERIFY: docs list boolean/json among column types, unclear if they are
// standalone helpers or only modes on integer/text. we ship both spellings.
export const boolean = (name: string) => new Column(name, 'INTEGER', 'boolean')
export const json = (name: string) => new Column(name, 'TEXT', 'json')

export interface TableMeta {
  name: string
  columns: Record<string, Column>
}

export interface Table {
  _: TableMeta
}

export function table<T extends Record<string, Column>>(name: string, columns: T): Table & T {
  return { _: { name, columns }, ...columns }
}

export function isTable(v: unknown): v is Table {
  return typeof v === 'object' && v !== null && typeof (v as Table)._?.name === 'string'
}

// js value -> what better-sqlite3 accepts
export function toDriver(col: Column | undefined, v: unknown): unknown {
  if (v === undefined || v === null) return null
  switch (col?.mode) {
    case 'timestamp':
      // TODO-VERIFY: platform may store seconds, we assume ms since epoch
      return (v as Date).getTime()
    case 'boolean':
      return v ? 1 : 0
    case 'json':
      return JSON.stringify(v)
    default:
      return v
  }
}

export function fromDriver(col: Column, v: unknown): unknown {
  if (v === null) return null
  switch (col.mode) {
    case 'timestamp':
      return new Date(v as number)
    case 'boolean':
      return !!v
    case 'json':
      return JSON.parse(v as string)
    default:
      return v
  }
}
