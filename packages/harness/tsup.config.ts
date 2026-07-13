import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    sdk: 'src/sdk.ts',
    'sdk-db': 'src/sdk-db.ts',
    vitest: 'src/vitest.ts',
  },
  format: 'esm',
  platform: 'node',
  target: 'node20',
  // entries must share one state chunk, otherwise 'sdk' and the harness would
  // see different "current harness" singletons
  splitting: true,
  dts: true,
  clean: true,
})
