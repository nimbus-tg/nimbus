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
