import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // core imports 'sdk' (the platform module); tests run under node, so point
    // it at a stub that records api calls
    alias: [{ find: /^sdk$/, replacement: path.join(import.meta.dirname, 'test/sdk-stub.ts') }],
  },
})
