import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// tests import generated handlers/, so vendor before collecting
export default function () {
  execFileSync('pnpm', ['exec', 'nimbus', 'vendor'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: 'inherit',
  })
}
