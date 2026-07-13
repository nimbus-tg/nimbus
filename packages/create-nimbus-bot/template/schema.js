import { table, integer, text } from 'sdk/db'

export const users = table('users', {
  id: integer('id').primaryKey(),
  name: text('name'),
  firstSeen: integer('first_seen', { mode: 'timestamp' }),
})
