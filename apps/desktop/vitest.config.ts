import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'out/',
        '**/*.d.ts',
        'tests/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer/src'),
      '@wealth-freedom/shared': resolve(__dirname, '../../packages/shared'),
    },
  },
})
