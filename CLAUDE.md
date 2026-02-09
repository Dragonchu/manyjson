# CLAUDE.md - ManyJson Development Guide

## Project Overview

ManyJson is a JSON Schema and JSON File management application built with **Vue 3 + TypeScript**. It supports two deployment targets: **Web** (browser/Cloudflare Workers) and **Desktop** (Electron). The same Vue/TypeScript source code powers both targets via a platform abstraction layer.

## Quick Reference

```bash
# Development
npm run dev:web          # Web dev server (localhost:5173)
npm run electron:dev     # Desktop dev (Vite + Electron concurrently)

# Build
npm run build:web        # Web production build + sitemap generation
npm run electron:build   # Desktop app (macOS/Windows/Linux)

# Test
npm run test             # Run Vitest (watch mode)

# Deploy
npm run worker:deploy    # Deploy to Cloudflare Workers

# Clean
npm run clean            # Remove node_modules, dist, dist-electron, out, release
```

## Tech Stack

- **Framework**: Vue 3 (v3.5.18) with Composition API (`<script setup>`)
- **Language**: TypeScript (strict mode, `noUnusedLocals`, `noUnusedParameters`)
- **State Management**: Pinia (v3.0.3) with setup stores (composition-style)
- **Routing**: Vue Router v4 (history mode for web, hash mode for desktop)
- **Build Tool**: Vite v5 with conditional Electron plugin
- **Desktop**: Electron v28 with electron-builder
- **Code Editor**: CodeMirror 6 via vue-codemirror6
- **JSON Validation**: AJV v8 + ajv-formats
- **Testing**: Vitest v1 with jsdom environment
- **Deployment**: Cloudflare Workers (wrangler)

## Project Structure

```
manyjson/
├── src/
│   ├── main.ts                 # Universal entry point
│   ├── main-web.ts             # Web entry (history routing, SEO)
│   ├── main-desktop.ts         # Desktop entry (hash routing)
│   ├── App.vue                 # Root component
│   ├── worker.ts               # Cloudflare Workers entry
│   ├── seo.ts                  # SEO meta tag management
│   ├── style.css               # Global styles (Apple HIG design tokens)
│   │
│   ├── components/             # Vue components
│   │   ├── AddFilePopup.vue
│   │   ├── AddSchemaDialog.vue
│   │   ├── AdvancedJsonEditor.vue  # CodeMirror-based editor
│   │   ├── AppSidebar.vue          # Left panel (schema list)
│   │   ├── ContextMenu.vue
│   │   ├── FileSelectorPopup.vue
│   │   ├── JsonDiffViewer.vue
│   │   ├── JsonHighlight.vue
│   │   ├── MiddlePanel.vue         # Center panel (file list)
│   │   ├── MobileFriendly.vue
│   │   ├── RightPanel.vue          # Right panel (editor)
│   │   ├── ShareSchemaPopup.vue
│   │   ├── StatusBar.vue
│   │   ├── ThemeToggle.vue
│   │   └── icons/                  # SVG icon components
│   │
│   ├── stores/                 # Pinia stores
│   │   ├── app.ts              # Core state (schemas, files, validation)
│   │   └── ui.ts               # UI state (theme, layout, mobile, shortcuts)
│   │
│   ├── services/               # Business logic
│   │   ├── fileService.ts      # File I/O abstraction
│   │   ├── validationService.ts # JSON Schema validation (AJV)
│   │   └── shareService.ts     # Schema sharing/import (lz-string URLs)
│   │
│   ├── composables/            # Vue composition functions
│   │   ├── useCapability.ts    # Feature capability detection
│   │   ├── useInlineRename.ts  # Inline rename behavior
│   │   └── useSchemaManager.ts # Schema management logic
│   │
│   ├── platform/               # Platform abstraction layer
│   │   ├── index.ts            # Interfaces (PlatformApis, PlatformCapabilities)
│   │   ├── runtime.ts          # Platform runtime detection
│   │   ├── web.ts              # Web implementation (localStorage, IndexedDB)
│   │   └── desktop.ts          # Desktop implementation (Electron IPC)
│   │
│   ├── views/
│   │   └── Home.vue            # Main three-panel layout
│   │
│   └── types/
│       └── seo.ts
│
├── electron/                   # Electron main process
│   ├── main.ts                 # Window creation, IPC handlers
│   └── preload.ts              # Secure renderer bridge (contextBridge)
│
├── test/
│   ├── app.test.ts             # Store and functionality tests
│   ├── test-data.json          # Valid test data
│   └── invalid-test.json       # Invalid JSON for error testing
│
├── doc/                        # Design and implementation docs
├── example/                    # Example JSON schemas and data files
├── assets/                     # App icons (PNG, ICNS, ICO)
├── scripts/
│   └── generate-sitemap.mjs    # Sitemap generator for web builds
├── public/                     # Static web assets (robots.txt, favicon)
│
├── index.html                  # Desktop/hybrid entry HTML
├── index-web.html              # Web-only entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── wrangler.jsonc              # Cloudflare Workers config
└── DESIGN_SYSTEM.md            # Apple HIG design system reference
```

## Architecture

### Platform Abstraction (Critical Pattern)

The codebase uses a platform abstraction layer to share code between web and desktop targets. This is the most important architectural pattern to understand.

- **`src/platform/index.ts`** defines `PlatformApis` and `PlatformCapabilities` interfaces
- **`src/platform/web.ts`** implements browser-based storage (localStorage, IndexedDB)
- **`src/platform/desktop.ts`** implements Electron IPC-based file operations
- **`src/platform/runtime.ts`** detects the current platform at runtime

**Convention**: Never call `window.electronAPI` directly from components. Use the platform abstraction or `useCapability()` composable to check for features and handle downgrade paths.

### State Management

Two Pinia stores using setup/composition style (not options style):

- **`app` store** (`src/stores/app.ts`): Core data — schemas, JSON files, CRUD operations, schema associations, persistence (Electron config files or localStorage)
- **`ui` store** (`src/stores/ui.ts`): UI state — edit mode, theme (light/dark/auto), mobile detection, sidebar layout, status messages, diff mode

### Dual Entry Points

The app has separate entry points controlled by the `BUILD_TARGET` and `VITE_APP_TARGET` environment variables:

- `BUILD_TARGET=web` → uses `index-web.html` + `src/main-web.ts` (history routing, SEO)
- `BUILD_TARGET=desktop` → uses `index.html` + `src/main-desktop.ts` (hash routing)
- Vite conditionally includes the Electron plugin only for desktop builds

### Three-Panel Layout

The main UI (`src/views/Home.vue`) is a three-panel layout:
1. **Left** (`AppSidebar.vue`): Schema list with context menus
2. **Middle** (`MiddlePanel.vue`): JSON files associated with selected schema
3. **Right** (`RightPanel.vue`): CodeMirror editor for viewing/editing files

## Code Conventions

### TypeScript
- Strict mode is enabled (`strict: true` in tsconfig)
- `noUnusedLocals` and `noUnusedParameters` are enforced
- Path alias: `@/` maps to `./src/`
- Target: ES2020

### Vue Components
- Use `<script setup lang="ts">` (Composition API)
- Stores are accessed via composable-style Pinia stores: `const store = useAppStore()`

### Styling
- Apple Human Interface Guidelines (HIG) design system
- 8pt grid spacing system via CSS custom properties (`--space-1` through `--space-12`)
- Semantic color tokens (`--accent-primary`, `--accent-success`, `--accent-error`)
- Light/dark theme support with `[data-theme="dark"]` selector
- Typography scale: `--text-xs` through `--text-3xl`
- See `DESIGN_SYSTEM.md` and `src/style.css` for full token reference

### Logging
- Renderer process: `[RENDERER-INFO]`, `[RENDERER-ERROR]`, `[RENDERER-DEBUG]` prefixed console logs
- Main process (Electron): `[INFO]`, `[ERROR]`, `[DEBUG]` prefixed console logs
- Debug logs are dev-only in the main process

### File Naming
- Vue components: PascalCase (e.g., `AddSchemaDialog.vue`)
- Stores, services, composables: camelCase (e.g., `fileService.ts`, `useCapability.ts`)
- Platform adapters: lowercase (e.g., `web.ts`, `desktop.ts`)

## Testing

- **Framework**: Vitest with jsdom environment
- **Location**: `test/` directory
- **Run**: `npm run test` (watch mode) or `npx vitest run` (single run)
- **Mocking**: Tests mock `window.electronAPI` to simulate Electron APIs
- **Store tests**: Use `createPinia()` + `setActivePinia()` in `beforeEach`

## Build & Deployment

### Web
```bash
npm run build:web   # Outputs to dist/, also generates sitemap
```
Deployable as a static SPA or via Cloudflare Workers (`npm run worker:deploy`).

### Desktop (Electron)
```bash
npm run electron:build  # Builds via electron-builder
```
Produces platform-specific packages:
- **macOS**: DMG + ZIP (x64 and arm64)
- **Windows**: NSIS installer + portable (x64)
- **Linux**: AppImage + snap

### CI/CD
GitHub Actions (`.github/workflows/release.yml`):
- Triggers on `v*` tags or manual dispatch
- Builds on macOS, Windows, and Linux
- Node.js 18 with `npm ci`
- Creates GitHub release with all platform artifacts

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `vue` | UI framework |
| `pinia` | State management |
| `vue-router` | Client-side routing |
| `ajv` + `ajv-formats` | JSON Schema validation |
| `codemirror` + `vue-codemirror6` | Code editor |
| `lz-string` | URL compression for schema sharing |
| `electron` | Desktop app shell |
| `vite` | Build tool and dev server |
| `vitest` | Test runner |
| `wrangler` | Cloudflare Workers CLI |

## Common Tasks

### Adding a new Vue component
1. Create `src/components/YourComponent.vue` with `<script setup lang="ts">`
2. Use design tokens from `style.css` for spacing and colors
3. Import and use in parent component

### Adding a new platform API
1. Add the method signature to `PlatformApis` interface in `src/platform/index.ts`
2. Implement in both `src/platform/web.ts` and `src/platform/desktop.ts`
3. If desktop-specific, add IPC handler in `electron/main.ts` and expose via `electron/preload.ts`
4. Update `PlatformCapabilities` if it represents a new capability

### Adding a new store action
1. Add the function inside the `defineStore` callback in the relevant store
2. Return it from the store's return object
3. Add corresponding tests in `test/app.test.ts`
