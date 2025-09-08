# JSON File Association Feature Implementation

## Overview
This document describes the implementation of the JSON file association feature (Linear issue MJ-18) that allows users to create and associate JSON files with JSON schemas through an intuitive popup interface.

## Features Implemented

### 1. Add JSON File Button
- **Location**: Top right area of the "Associated JSON Files" panel
- **Functionality**: Opens an animated popup window for creating JSON files
- **UI**: Blue button with a plus icon and "Add" text
- **Visibility**: Only shown when a schema is currently selected

### 2. Popup Window with JSON Editor
- **Interface**: Modal popup with the same functionality as the right panel
- **Animation**: Smooth fade-in and slide-up animation for enhanced UX
- **File Naming**: Input field for specifying the JSON file name
- **JSON Editor**: Full-featured textarea with syntax validation
- **Real-time Validation**: Live validation against the selected schema with error display

### 3. Persistence to Disk
- **Electron Mode**: Saves schema associations to `schema-associations.json` in the config directory
- **Web Mode**: Falls back to localStorage for persistence
- **Data Structure**: Stores schema path, name, and associated file information including validation status

### 4. Loading on Startup
- **Automatic Loading**: Loads previously saved associations when the app starts
- **File Re-validation**: Re-validates associated files against current schemas
- **Graceful Degradation**: Continues to work even if some previously associated files are no longer accessible

## Technical Implementation

### Components Modified/Added
- `src/components/MiddlePanel.vue`: Added the "Add" button and popup trigger
- `src/components/AddFilePopup.vue`: New popup component with JSON editor functionality
- `src/views/Home.vue`: Integrated the AddFilePopup component

### Store Functions Added
- `saveSchemaAssociations()`: Persists schema associations to disk/localStorage
- `loadSchemaAssociations()`: Loads schema associations on startup

### Key Technical Features
- **Teleport**: Uses Vue's Teleport to render popup at body level
- **Event System**: Custom events for component communication
- **Animation**: CSS transitions for smooth popup appearance/disappearance
- **Keyboard Support**: ESC key to close popup, Enter key to save

### Key Features
- **Cross-platform**: Works in both Electron and web environments
- **Validation**: Automatic JSON schema validation for added files
- **Persistence**: Reliable data persistence with fallback mechanisms
- **Error Handling**: Comprehensive error handling with user feedback
- **Performance**: Efficient file loading and validation

## Usage

1. **Select a Schema**: Choose a JSON schema from the left panel
2. **Open Popup**: Click the "Add" button in the Associated JSON Files panel
3. **Enter File Name**: Specify a name for the new JSON file
4. **Write JSON**: Create JSON content in the editor with real-time validation
5. **Save**: Click the save button to create and associate the file
6. **Persistence**: The association is automatically saved and will be restored when the app reopens

## File Structure

```
Associated JSON Files Panel
├── Header
│   ├── Title: "Associated JSON Files"
│   └── Add Button (when schema selected) → Opens Popup
├── Schema Info
└── File List
    ├── Valid Files (green indicator)
    └── Invalid Files (red indicator with error count)

Add File Popup
├── Header
│   ├── Title: "Add JSON File"
│   ├── Schema Info
│   ├── Validation Status
│   └── Action Buttons (Save/Cancel)
├── File Name Input
└── JSON Editor
    ├── Syntax Highlighting
    ├── Real-time Validation
    └── Error Display Panel
```

## Error Handling

- **Invalid JSON**: Shows "Invalid JSON syntax" error with real-time feedback
- **Empty File Name**: Prevents saving without a valid file name
- **Duplicate Files**: Shows "A file with this name already exists" error
- **Schema Validation**: Real-time validation with detailed error messages and counts
- **Save Prevention**: Disables save button when validation errors exist

## Persistence Details

### Electron Mode
- **Location**: Config directory (platform-specific)
- **File**: `schema-associations.json`
- **Format**: JSON array with schema associations

### Web Mode
- **Location**: Browser localStorage
- **Key**: `schema-associations`
- **Format**: JSON string with schema associations

## Animation Details

The popup features smooth animations to enhance user experience:

### Popup Appearance
- **Overlay**: Fade-in effect (opacity 0 → 1) over 0.3s
- **Window**: Slide-up and scale effect (translateY(20px) scale(0.95) → translateY(0) scale(1))
- **Focus**: Automatic focus on file name input after animation completes

### Popup Disappearance
- **Reverse Animation**: Smooth fade-out and slide-down
- **State Cleanup**: Delayed state reset after animation completes

## Future Enhancements

Potential improvements that could be added:
1. Syntax highlighting for JSON content
2. Auto-completion based on schema properties
3. JSON formatting/prettification tools
4. Template generation from schema
5. Import from clipboard functionality
6. Drag and drop support for the popup
7. Resizable popup window

## 任务总纲（LC-88 支持 Web 模式下新增 Schema）

### 简介
在 Web 模式（无本地文件系统能力）下，支持通过应用内对话框新增 JSON Schema，并在内存与本地存储降级策略下正常工作；桌面模式继续持久化到配置目录。

### To-Do 列表
- 子任务：阅读 /doc 并提炼约束（已完成）
  - 执行步骤：通读 `/doc` 下文档，确认存储策略与平台能力差异。
- 子任务：分析现有 Schema 与 Web 模式实现（已完成）
  - 执行步骤：检查 `src/stores/app.ts`、`src/platform/web.ts`、`src/composables/useSchemaManager.ts`。
- 子任务：设计 Web 新增 Schema 流程（已完成）
  - 执行步骤：前端表单校验 → 委托 store 统一处理（Electron 持久化 / Web 内存）。
- 子任务：实现前端对接（已完成）
  - 执行步骤：更新 `useSchemaManager.ts`，改为调用 `appStore.addSchema` 并保留 UI 校验、提示。
- 子任务：更新文档与 .gitignore（进行中）
  - 执行步骤：补充本节说明；检查忽略生成物配置。

### 附注
- Web 模式下 `writeConfigFile` 为非持久降级，store 已内置分支：Electron 持久化，Web 使用内存与 `localStorage` 关联数据。
- 新增 Schema 的 UI 入口为 `src/components/AddSchemaDialog.vue`，校验与模板功能保持不变。
- 关键变更：`src/composables/useSchemaManager.ts` 由直接写文件改为委托 `appStore.addSchema`，从而继承平台差异处理逻辑。