import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['utils/**/*.test.ts'],
    exclude: ['node_modules', '.output', '.wxt'],
    environment: 'node',
  },
})
