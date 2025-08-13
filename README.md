# ManyJson - JSON Schema Manager

A modern JSON Schema management application built with **Vue 3**, **TypeScript**, and **Electron**, featuring real-time validation and an intuitive three-column interface.

## Features

- **Three-Column Layout**: Schema tree, file list, and content viewer
- **Real-time Validation**: Instant JSON Schema validation using AJV
- **File Management**: Organize and associate JSON files with schemas
- **Syntax Highlighting**: Beautiful JSON syntax highlighting
- **Desktop & Web**: Runs as both Electron desktop app and web application
- **Modern UI**: Dark theme with responsive design

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Web development mode
npm run dev

# Electron development mode  
npm run electron:dev

# Run tests
npm test
```

### Production Build
```bash
# Build for web
npm run build

# Build for Electron
npm run electron:build
```

## Project Structure

```
├── doc/                    # Documentation files
├── example/                # Example JSON files and schemas
├── test/                   # Test files and test data
├── src/
│   ├── components/         # Vue components
│   ├── stores/            # Pinia state management
│   └── views/             # Application views
├── electron/              # Electron main process
└── dist-electron/         # Built Electron files
```

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Pinia
- **Desktop**: Electron 28
- **Build**: Vite
- **Testing**: Vitest
- **Validation**: AJV JSON Schema

## License

MIT License
