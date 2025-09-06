import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDesktop = process.env.BUILD_TARGET === 'desktop'
  return {
    plugins: [
      vue(),
      ...(isDesktop
        ? [
            electron([
              {
                entry: 'electron/main.ts',
                onstart(args) {
                  args.startup()
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                    lib: {
                      entry: 'electron/main.ts',
                      formats: ['cjs']
                    },
                    rollupOptions: {
                      external: ['electron']
                    }
                  }
                }
              },
              {
                entry: 'electron/preload.ts',
                onstart(args) {
                  args.reload()
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                    lib: {
                      entry: 'electron/preload.ts',
                      formats: ['cjs']
                    }
                  }
                }
              }
            ])
          ]
        : [])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  }
})