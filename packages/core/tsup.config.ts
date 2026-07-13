import { defineConfig } from 'tsup'

export default defineConfig([
  // runtime: what ends up vendored into user projects. must stay pure ESM,
  // zero deps, imports only from 'sdk' / 'sdk/db'
  {
    entry: { index: 'src/index.ts' },
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    external: ['sdk', 'sdk/db'],
    dts: true,
    clean: true,
  },
  // cli: runs on the developer machine, node is fine here
  {
    entry: { cli: 'src/cli.ts' },
    format: 'esm',
    platform: 'node',
    target: 'node20',
    external: ['esbuild'],
    banner: { js: '#!/usr/bin/env node' },
  },
])
