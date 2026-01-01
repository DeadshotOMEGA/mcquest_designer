import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'web',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        'e2e',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/tests',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mcquest/schema': path.resolve(__dirname, '../../packages/schema/src'),
      '@mcquest/export': path.resolve(__dirname, '../../packages/export/src'),
    },
  },
})
