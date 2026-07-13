import { afterEach, beforeEach, expect, it } from 'vitest'
import { createHarness, type Harness } from '../src'
import { boolean, integer, table, text } from '../src/sdk-db'
import { and, eq, gt, inArray, like, sql } from '../src/ops'

const users = table('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age'),
  admin: boolean('admin').notNull().default(false),
  joined: integer('joined', { mode: 'timestamp' }),
  prefs: text('prefs', { mode: 'json' }),
})

let h: Harness
beforeEach(() => {
  h = createHarness({ schema: { users } })
})
afterEach(() => h.close())

it('insert + select roundtrip with mode conversions', async () => {
  const joined = new Date('2026-01-15T12:00:00Z')
  await h.db.insert(users).values({
    id: 1,
    name: 'ann',
    age: 30,
    admin: true,
    joined,
    prefs: { lang: 'en', notify: false },
  })

  const [row] = await h.db.select().from(users).where(eq(users.id, 1))
  expect(row).toMatchObject({ id: 1, name: 'ann', age: 30, admin: true })
  expect(row!.joined).toEqual(joined)
  expect(row!.prefs).toEqual({ lang: 'en', notify: false })
})

it('defaults apply when column omitted', async () => {
  await h.db.insert(users).values({ id: 2, name: 'bob' })
  const [row] = await h.db.select().from(users)
  expect(row!.admin).toBe(false)
  expect(row!.age).toBeNull()
})

it('update with where', async () => {
  await h.db.insert(users).values([
    { id: 1, name: 'ann' },
    { id: 2, name: 'bob' },
  ])
  await h.db.update(users).set({ admin: true }).where(eq(users.name, 'ann'))
  const rows = await h.db.select().from(users).where(eq(users.admin, true))
  expect(rows.map((r) => r.id)).toEqual([1])
})

it('delete', async () => {
  await h.db.insert(users).values([
    { id: 1, name: 'ann' },
    { id: 2, name: 'bob' },
  ])
  await h.db.delete(users).where(eq(users.id, 1))
  expect(await h.db.select().from(users)).toHaveLength(1)
})

it('compound conditions', async () => {
  await h.db.insert(users).values([
    { id: 1, name: 'ann', age: 30 },
    { id: 2, name: 'annette', age: 20 },
    { id: 3, name: 'bob', age: 40 },
  ])
  const rows = await h.db
    .select()
    .from(users)
    .where(and(like(users.name, 'ann%'), gt(users.age, 25)))
  expect(rows.map((r) => r.id)).toEqual([1])

  const byIds = await h.db.select().from(users).where(inArray(users.id, [2, 3]))
  expect(byIds).toHaveLength(2)
})

it('raw sql escape hatch', async () => {
  await h.db.insert(users).values({ id: 1, name: 'ann' })
  const row = (await h.db.get(sql`SELECT count(*) AS n FROM ${users}`)) as { n: number }
  expect(row.n).toBe(1)
})

it('rejects unknown columns instead of writing garbage', async () => {
  await expect(h.db.insert(users).values({ id: 1, name: 'x', nope: 1 })).rejects.toThrow(
    /unknown column/,
  )
})
