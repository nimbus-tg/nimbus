import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // template/ holds the scaffolded project's own tests, don't run them here
    include: ['test/**/*.test.js'],
  },
})
