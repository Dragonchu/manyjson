import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'

export default defineConfig(({ mode }) => {
  const isDesktop = process.env.BUILD_TARGET === 'desktop'
  const isWeb = process.env.BUILD_TARGET === 'web'

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
    base: isWeb ? '/' : './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: isWeb ? {
        input: {
          main: resolve(__dirname, 'index-web.html')
        }
      } : undefined
    }
  }
})