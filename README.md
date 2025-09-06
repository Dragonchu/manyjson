# ManyJson - JSON Schema And File Manager

A modern JSON Schema and JSON File management application.

## Features

- **Real-time Validation**: Instant JSON Schema validation using AJV
- **File Management**: Organize and associate JSON files with schemas
- **Syntax Highlighting**: Beautiful JSON syntax highlighting

## Build Targets

This project supports dual targets: Web and Desktop (Electron).

- Web development: `npm run dev:web`
- Desktop development: `npm run electron:dev`
- Web production build: `npm run build:web`
- Desktop production build: `npm run electron:build`

Vite decides whether to include the Electron builder based on `BUILD_TARGET`. The HTML bootstraps `src/main-web.ts` or `src/main-desktop.ts` using `VITE_APP_TARGET`.

### Platform Abstraction

- Core code avoids direct `window.electronAPI` calls.
- `src/platform/` provides interfaces and two adapters:
  - `web.ts`: Browser fallback implementations and capabilities
  - `desktop.ts`: Electron-backed implementations via preload APIs
- Use `useCapability()` to check features and handle downgrade prompts.

