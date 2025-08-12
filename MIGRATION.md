# Migration Guide: Electron to Vue 3 + Electron

This guide helps you migrate from the original Electron-based ManyJson application to the new Vue 3 + TypeScript + Electron version.

## 🎯 Migration Overview

The Vue 3 refactored version maintains **100% functional compatibility** with the original application while introducing modern development practices and improved maintainability.

### What Changed
- **Frontend Framework**: Plain HTML/JS → Vue 3 + TypeScript
- **State Management**: Global variables → Pinia store
- **Build System**: Direct Electron → Vite + Electron
- **Code Organization**: Single files → Component-based architecture
- **Development Experience**: Manual reload → Hot Module Replacement (HMR)

### What Stayed the Same
- **User Interface**: Identical Linear Design System
- **Functionality**: All features preserved
- **File Formats**: Same JSON schemas and data files
- **Keyboard Shortcuts**: Unchanged shortcuts
- **Electron Integration**: Same desktop app experience

## 📁 File Structure Changes

### Before (Original)
```
├── src/
│   ├── index.html          # Main HTML file
│   ├── renderer.js         # All frontend logic
│   ├── main.js            # Electron main process
│   └── preload.js         # IPC bridge
├── *.json                 # Sample data files
└── package.json           # Dependencies
```

### After (Vue 3)
```
├── electron/
│   ├── main.ts             # Electron main process (TypeScript)
│   └── preload.ts          # IPC bridge (TypeScript)
├── src/
│   ├── components/         # Vue components
│   │   ├── LeftPanel.vue   # Schema management
│   │   ├── MiddlePanel.vue # File list
│   │   ├── RightPanel.vue  # Content viewer
│   │   └── ...
│   ├── stores/
│   │   └── app.ts          # Pinia store
│   ├── views/
│   │   └── Home.vue        # Main view
│   ├── main.ts             # Vue app entry
│   └── style.css           # Global styles
├── index.html              # HTML entry point
├── vite.config.ts          # Build configuration
└── package.json            # Updated dependencies
```

## 🔧 Development Workflow Changes

### Before: Direct Electron Development
```bash
# Original workflow
npm install
npm start                   # Start Electron directly
```

### After: Modern Development
```bash
# New workflow options
npm install

# Web development (faster iteration)
npm run dev                 # Vue dev server at localhost:5173

# Electron development
npm run electron:dev        # Vue dev server + Electron

# Production build
npm run build              # Build for production
npm run electron           # Run production build in Electron
```

## 🏗️ Architecture Migration

### State Management Migration

#### Before: Global Variables
```javascript
// renderer.js
let currentSchema = null;
let currentJsonFile = null;
let schemaData = {};
let jsonFiles = {};
let isEditMode = false;
```

#### After: Pinia Store
```typescript
// stores/app.ts
export const useAppStore = defineStore('app', () => {
  const currentSchema = ref<SchemaInfo | null>(null)
  const currentJsonFile = ref<JsonFile | null>(null)
  const schemas = ref<SchemaInfo[]>([])
  const jsonFiles = ref<JsonFile[]>([])
  const isEditMode = ref(false)
  
  // Actions, getters, etc.
  return { /* ... */ }
})
```

### Component Architecture

#### Before: Monolithic HTML/JS
```html
<!-- All UI in single HTML file -->
<div class="left-panel">
  <div class="schema-tree" id="schemaTree">
    <!-- All logic in renderer.js -->
  </div>
</div>
```

#### After: Component-Based
```vue
<!-- LeftPanel.vue -->
<template>
  <div class="left-panel">
    <div class="schema-tree">
      <div
        v-for="schema in appStore.schemas"
        :key="schema.path"
        @click="selectSchema(schema)"
      >
        {{ schema.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()
// Component logic here
</script>
```

## 🔄 Feature Compatibility Matrix

| Feature | Original | Vue 3 Version | Status |
|---------|----------|---------------|---------|
| Three-column layout | ✅ | ✅ | ✅ Identical |
| Schema tree navigation | ✅ | ✅ | ✅ Enhanced with Vue reactivity |
| JSON file validation | ✅ | ✅ | ✅ Same AJV validation |
| Syntax highlighting | ✅ | ✅ | ✅ Improved component-based |
| Edit mode | ✅ | ✅ | ✅ Better state management |
| Copy to clipboard | ✅ | ✅ | ✅ Same functionality |
| Context menus | ✅ | ✅ | ✅ Component-based |
| Error display | ✅ | ✅ | ✅ Enhanced error handling |
| Panel resizing | ✅ | ✅ | ✅ Preserved behavior |
| Status notifications | ✅ | ✅ | ✅ Reactive status bar |
| Keyboard shortcuts | ✅ | ✅ | ✅ Same shortcuts |
| Electron integration | ✅ | ✅ | ✅ Improved IPC handling |

## 🚀 Migration Steps

### Step 1: Backup Current Installation
```bash
# Backup your current installation
cp -r manyjson-electron manyjson-electron-backup
```

### Step 2: Install Vue 3 Version
```bash
# Clone or download the Vue 3 version
git clone <vue3-repository-url> manyjson-vue
cd manyjson-vue
npm install
```

### Step 3: Migrate Custom Data (if any)
If you have custom JSON schemas or data files:

```bash
# Copy your custom files to the new version
cp ../manyjson-electron/*.json ./
```

### Step 4: Test the Migration
```bash
# Test web version first
npm run dev

# Test Electron version
npm run electron:dev
```

### Step 5: Update Development Workflow
Update your development scripts and bookmarks:
- **Development**: `npm run dev` or `npm run electron:dev`
- **Production**: `npm run build && npm run electron`
- **Testing**: `npm test`

## 🛠️ Customization Migration

### Theme/Style Customizations
If you customized the original CSS:

#### Before: Direct CSS modification
```css
/* Modified index.html styles */
:root {
  --linear-accent: #your-custom-color;
}
```

#### After: CSS Variables in style.css
```css
/* src/style.css */
:root {
  --linear-accent: #your-custom-color;
}
```

### Custom JavaScript Logic
If you added custom functionality:

#### Before: Modified renderer.js
```javascript
// Custom function in renderer.js
function myCustomFunction() {
  // Custom logic
}
```

#### After: Create Custom Vue Component or Store Action
```typescript
// Option 1: Custom component
// src/components/CustomComponent.vue

// Option 2: Store action
// src/stores/app.ts
export const useAppStore = defineStore('app', () => {
  function myCustomAction() {
    // Custom logic
  }
  
  return { myCustomAction }
})
```

## 🧪 Testing Your Migration

### Functional Testing Checklist
- [ ] All schemas load correctly
- [ ] JSON files validate properly
- [ ] Edit mode works as expected
- [ ] Copy functionality works
- [ ] Context menus appear
- [ ] Panel resizing functions
- [ ] Status messages display
- [ ] Keyboard shortcuts work
- [ ] Error messages show correctly
- [ ] File saving works (if implemented)

### Performance Testing
```bash
# Test build performance
npm run build

# Test development performance
npm run dev
```

## 🐛 Troubleshooting Common Issues

### Issue: Application won't start
**Solution**: Check Node.js version (requires v18+)
```bash
node --version  # Should be v18 or higher
npm install     # Reinstall dependencies
```

### Issue: Styles look different
**Solution**: Ensure all CSS variables are preserved
```bash
# Compare style files
diff ../manyjson-electron/src/index.html src/style.css
```

### Issue: Custom data not loading
**Solution**: Check data file paths and formats
```typescript
// Update store with your custom data paths
// src/stores/app.ts
```

### Issue: Electron features not working
**Solution**: Verify IPC communication
```bash
# Check Electron processes
npm run electron:dev
# Look for console errors in both main and renderer processes
```

## 📈 Benefits After Migration

### Development Experience
- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Better code completion and error catching
- **Component Dev Tools**: Vue DevTools for debugging
- **Modern Build System**: Faster builds with Vite

### Code Quality
- **Type Safety**: Catch errors at compile time
- **Component Isolation**: Easier testing and maintenance
- **State Management**: Predictable state changes
- **Modern Patterns**: Industry-standard Vue 3 practices

### Future-Proofing
- **Active Ecosystem**: Vue 3 has long-term support
- **Easy Updates**: Component-based architecture
- **Testing Support**: Built-in testing framework
- **Extensibility**: Plugin system and composables

## 🎯 Next Steps

After successful migration:

1. **Explore New Features**:
   - Use Vue DevTools for debugging
   - Try the web version for quick testing
   - Experiment with component customization

2. **Improve Development Workflow**:
   - Set up IDE with Vue/TypeScript support
   - Use the testing framework for custom features
   - Leverage hot reload for faster development

3. **Contribute Back**:
   - Report any migration issues
   - Suggest improvements
   - Share custom components

## 📞 Support

If you encounter issues during migration:

1. **Check the README**: Comprehensive setup guide
2. **Review this migration guide**: Common solutions
3. **Create an issue**: Report migration-specific problems
4. **Compare with original**: Verify expected behavior

---

**Happy migrating!** The Vue 3 version provides the same great experience with modern development benefits.