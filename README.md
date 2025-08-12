# ManyJson - JSON Schema Manager (Vue 3 Edition)

A professional three-column JSON Schema management application built with **Vue 3**, **TypeScript**, and **Electron**, featuring real-time validation, intuitive navigation, and modern Linear Design System aesthetics.

## 🚀 Features

### Three-Column Architecture
- **Left Panel**: JSON Schema management with collapsible tree structure
- **Middle Panel**: Dynamic content area showing JSON files associated with selected schema
- **Right Panel**: Detailed JSON content view with real-time schema validation

### Core Functionality
- ✅ **JSON Schema Management**: Organize schemas in hierarchical folder structure
- ✅ **Real-time Validation**: Instant feedback using AJV JSON Schema validator
- ✅ **File Association**: Automatic mapping between schemas and JSON files
- ✅ **Syntax Highlighting**: Beautiful JSON syntax highlighting
- ✅ **Error Detection**: Visual indicators for validation errors
- ✅ **JSON Editing**: In-place editing with syntax validation
- ✅ **Copy to Clipboard**: One-click JSON copying with visual feedback
- ✅ **Context Menus**: Right-click operations for schema management
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Resizable Panels**: Drag handles to adjust panel widths
- ✅ **Keyboard Shortcuts**: Quick access to common operations

### Visual Design
- 🎨 **Linear Design System**: Modern dark theme with gradients and glows
- 📱 **Responsive Layout**: Mobile-friendly responsive design
- ✨ **Smooth Animations**: Elegant transitions and hover effects
- 🎯 **Intuitive UX**: Clear visual hierarchy and interaction patterns

## 🛠️ Technical Stack

### Frontend
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Build Tool**: Vite
- **Testing**: Vitest

### Desktop
- **Framework**: Electron 28
- **Validation**: AJV (JSON Schema validator)
- **Architecture**: Three-column responsive layout
- **Design System**: Linear-inspired dark theme
- **File System**: Native Node.js file operations

## 📁 Project Structure

```
├── electron/
│   ├── main.ts             # Electron main process
│   └── preload.ts          # Secure API bridge
├── src/
│   ├── components/         # Vue components
│   │   ├── icons/          # SVG icon components
│   │   ├── LeftPanel.vue   # Schema tree management
│   │   ├── MiddlePanel.vue # JSON files list
│   │   ├── RightPanel.vue  # JSON content viewer
│   │   ├── StatusBar.vue   # Status notifications
│   │   ├── ContextMenu.vue # Right-click menu
│   │   └── JsonHighlight.vue # JSON syntax highlighting
│   ├── stores/
│   │   ├── app.ts          # Main Pinia store
│   │   └── __tests__/      # Store unit tests
│   ├── views/
│   │   └── Home.vue        # Main application view
│   ├── main.ts             # Vue app entry point
│   └── style.css           # Global styles (Linear Design System)
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Testing configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd manyjson-vue

# Install dependencies
npm install
```

### Development

#### Web Development Mode
```bash
# Start the Vue development server
npm run dev

# Open http://localhost:5173 in your browser
```

#### Electron Development Mode
```bash
# Start both Vue dev server and Electron
npm run electron:dev
```

#### Production Build
```bash
# Build for production
npm run build

# Run Electron with production build
npm run electron
```

### Testing
```bash
# Run unit tests
npm test

# Run tests with UI
npm test:ui

# Run tests in watch mode
npm run test -- --watch
```

## 📋 Usage Guide

### Schema Management (Left Panel)
1. **View Schemas**: Browse schemas organized in folders
2. **Select Schema**: Click on any schema to view associated files
3. **Context Menu**: Right-click on schemas for additional options
   - View Schema: Display schema definition
   - Edit Schema: Modify schema (placeholder)
   - Delete Schema: Remove schema (placeholder)

### JSON Files (Middle Panel)
1. **File List**: View all JSON files associated with selected schema
2. **Validation Status**: Visual indicators show validation results
   - ✅ Green: Valid JSON
   - ❌ Red: Invalid JSON with error count
3. **File Selection**: Click any file to view its content

### Content Viewer (Right Panel)
1. **JSON Display**: Syntax-highlighted JSON content
2. **Validation Results**: Real-time validation feedback
3. **Error Details**: Specific validation error messages
4. **Schema View**: Option to view the associated schema definition
5. **Edit Mode**: In-place JSON editing with real-time validation
6. **Copy Function**: One-click copying to clipboard
7. **Action Buttons**: 
   - 📋 Copy JSON to clipboard
   - ✏️ Enter edit mode
   - 💾 Save changes (edit mode)
   - ❌ Cancel edit (edit mode)

### Panel Resizing
- Drag the vertical dividers between panels to adjust widths

## 🏗️ Architecture Overview

### Vue 3 Component Architecture
- **Composition API**: Modern reactive programming with `<script setup>`
- **Component-based Design**: Reusable, self-contained components
- **Props & Events**: Clear data flow between components
- **TypeScript**: Type-safe development with interfaces and generics

### State Management (Pinia)
- **Centralized Store**: Global application state management
- **Reactive State**: Automatic UI updates on state changes
- **Actions**: Async operations and business logic
- **Computed Properties**: Derived state with caching

### Electron Integration
- **Main Process**: Window management and file system operations
- **Renderer Process**: Vue 3 application
- **Preload Script**: Secure API bridge between processes
- **IPC Communication**: Safe inter-process communication

## 🔧 Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **Vue 3**: Composition API with `<script setup>` syntax
- **Component Naming**: PascalCase for components, camelCase for functions
- **File Organization**: Group related files in feature directories

### Component Development
- Use `defineProps<T>()` for type-safe props
- Implement `defineEmits<T>()` for type-safe events
- Prefer Composition API over Options API
- Keep components focused and single-purpose

### State Management
- Use Pinia stores for global state
- Keep local state in components when appropriate
- Implement proper error handling in store actions
- Write unit tests for store logic

### Testing Strategy
- Unit tests for store logic and utility functions
- Component testing for Vue components
- Integration tests for critical user flows
- Mock external dependencies (Electron APIs)

## 🚢 Deployment

### Electron App Distribution
```bash
# Build and package for distribution
npm run electron:build

# The packaged app will be in the `out` directory
```

### Web Deployment
```bash
# Build for web deployment
npm run build

# Deploy the `dist` directory to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the development guidelines
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Migration Notes

This Vue 3 refactored version maintains full compatibility with the original Electron application while introducing modern frontend development practices:

### Key Improvements
- **Modern Framework**: Vue 3 with Composition API
- **Type Safety**: Full TypeScript integration
- **Better State Management**: Pinia instead of global variables
- **Component Architecture**: Modular, reusable components
- **Testing**: Comprehensive test coverage
- **Development Experience**: Hot reload, better debugging
- **Build System**: Vite for fast builds and development

### Preserved Features
- **UI/UX**: Identical Linear Design System styling
- **Functionality**: All original features maintained
- **Electron Integration**: Seamless desktop app experience
- **Performance**: Optimized with modern tooling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Vue.js team for the excellent framework
- Pinia team for the intuitive state management
- Electron team for cross-platform desktop apps
- Linear Design System for the beautiful UI inspiration