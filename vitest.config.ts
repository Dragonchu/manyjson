import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'electron/',
        'src/main.ts',
        'src/style.css'
      ],
      include: [
        'src/**/*.{js,ts,vue}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Test organization
    include: [
      'test/**/*.{test,spec}.{js,ts}'
    ],
    // Setup files
    setupFiles: ['test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})