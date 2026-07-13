import { Column, isTable, toDriver } from './columns'

export interface SqlChunk {
  sql: string
  params: unknown[]
}

const bin =
  (op: string) =>
  (col: Column, value: unknown): SqlChunk => ({
    sql: `"${col.name}" ${op} ?`,
    params: [toDriver(col, value)],
  })

export const eq = bin('=')
export const ne = bin('!=')
export const gt = bin('>')
export const gte = bin('>=')
export const lt = bin('<')
export const lte = bin('<=')

export const like = (col: Column, pattern: string): SqlChunk => ({
  sql: `"${col.name}" LIKE ?`,
  params: [pattern],
})

export const isNull = (col: Column): SqlChunk => ({ sql: `"${col.name}" IS NULL`, params: [] })

export const inArray = (col: Column, values: unknown[]): SqlChunk => ({
  sql: `"${col.name}" IN (${values.map(() => '?').join(', ')})`,
  params: values.map((v) => toDriver(col, v)),
})

const joinWith =
  (kw: string) =>
  (...conds: SqlChunk[]): SqlChunk => ({
    sql: `(${conds.map((c) => c.sql).join(` ${kw} `)})`,
    params: conds.flatMap((c) => c.params),
  })

export const and = joinWith('AND')
export const or = joinWith('OR')

export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlChunk {
  let out = strings[0] ?? ''
  const params: unknown[] = []
  values.forEach((v, i) => {
    if (v instanceof Column) out += `"${v.name}"`
    else if (isTable(v)) out += `"${v._.name}"`
    else {
      out += '?'
      params.push(v)
    }
    out += strings[i + 1] ?? ''
  })
  return { sql: out, params }
}
