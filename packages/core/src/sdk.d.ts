// hand-written against the BotCloud docs, which are incomplete.
// TODO-VERIFY: exact export surface once we get runtime access.
declare module 'sdk' {
  export const api: Record<string, (payload?: Record<string, unknown>) => Promise<any>>
  export const db: any
  export function fetch(
    url: string,
    init?: Record<string, unknown>,
  ): Promise<{ status: number; text(): Promise<string> }>
  export class BotApiError extends Error {
    method: string
    code: number
    description: string
    parameters?: Record<string, unknown>
  }
}

declare module 'sdk/db' {
  export function table(name: string, columns: Record<string, unknown>): any
  export function text(name: string, opts?: Record<string, unknown>): any
  export function integer(name: string, opts?: Record<string, unknown>): any
  export function real(name: string): any
  export function numeric(name: string): any
  export function blob(name: string): any
  export function eq(column: unknown, value: unknown): unknown
  export function ne(column: unknown, value: unknown): unknown
  export function and(...conds: unknown[]): unknown
  export function or(...conds: unknown[]): unknown
  export function sql(strings: TemplateStringsArray, ...values: unknown[]): unknown
}
