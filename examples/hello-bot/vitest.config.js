import { defineConfig } from 'vitest/config'
import { botProject } from '@nimbus-tg/harness/vitest'

export default defineConfig({
  resolve: {
    alias: botProject(import.meta.dirname),
  },
  test: {
    globalSetup: './test/setup.js',
  },
})
