import { existsSync } from 'node:fs'
import path from 'node:path'

function tryExtensions(p: string): string {
  for (const candidate of [p, `${p}.js`, path.join(p, 'index.js')]) {
    if (existsSync(candidate)) return candidate
  }
  return p
}

// resolve.alias entries teaching vitest the platform's bare import scheme:
// 'sdk' / 'sdk/db' -> harness shims, 'lib/*' / 'handlers/*' / 'schema' -> project files
export function botProject(root: string) {
  return [
    { find: /^sdk\/db$/, replacement: '@nimbus-tg/harness/sdk/db' },
    { find: /^sdk$/, replacement: '@nimbus-tg/harness/sdk' },
    { find: /^schema$/, replacement: path.join(root, 'schema.js') },
    {
      find: /^((?:lib|handlers)\/.*)$/,
      replacement: path.join(root, '$1'),
      customResolver: (source: string) => tryExtensions(source),
    },
  ]
}
