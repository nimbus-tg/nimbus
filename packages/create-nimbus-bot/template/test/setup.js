import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// tests import generated handlers/, so vendor before collecting
export default function () {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const bin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'nimbus.cmd' : 'nimbus')
  execFileSync(bin, ['vendor'], { cwd: root, stdio: 'inherit' })
}
