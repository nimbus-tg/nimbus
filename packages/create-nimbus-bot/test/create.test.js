import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it } from 'vitest'

const bin = fileURLToPath(new URL('../index.js', import.meta.url))

let dir
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

it('scaffolds a project', () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cnb-'))
  execFileSync(process.execPath, [bin, 'space-bot'], { cwd: dir })

  const root = path.join(dir, 'space-bot')
  for (const f of ['.gitignore', 'lib/bot.js', 'schema.js', 'vitest.config.js', 'test/bot.test.js']) {
    expect(existsSync(path.join(root, f)), f).toBe(true)
  }
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  expect(pkg.name).toBe('space-bot')
})

it('refuses a non-empty target', () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cnb-'))
  mkdirSync(path.join(dir, 'taken'))
  writeFileSync(path.join(dir, 'taken', 'x.txt'), 'hi')

  expect(() => execFileSync(process.execPath, [bin, 'taken'], { cwd: dir, stdio: 'pipe' })).toThrow()
})

it('prints usage without args', () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cnb-'))
  expect(() => execFileSync(process.execPath, [bin], { cwd: dir, stdio: 'pipe' })).toThrow()
})
