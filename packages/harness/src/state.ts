import type { MockApi } from './api'

export interface ActiveHarness {
  api: MockApi
  db: any
  fetch: (url: string, init?: Record<string, unknown>) => Promise<{ status: number; text(): Promise<string> }>
}

let current: ActiveHarness | null = null

export function activate(h: ActiveHarness) {
  current = h
}

export function active(): ActiveHarness {
  if (!current) throw new Error('no active harness, call createHarness() first')
  return current
}
