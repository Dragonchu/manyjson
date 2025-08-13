# JSON File Association Feature Implementation

## Overview
This document describes the implementation of the JSON file association feature (Linear issue MJ-18) that allows users to add JSON files that are associated with JSON schemas and persist them to disk.

## Features Implemented

### 1. Add JSON File Button
- **Location**: Top right area of the "Associated JSON Files" panel
- **Functionality**: Opens a file dialog to select JSON files to associate with the currently focused schema
- **UI**: Blue button with a plus icon and "Add File" text
- **Visibility**: Only shown when a schema is currently selected

### 2. File Association Logic
- **File Selection**: Uses native file dialog (Electron) or browser file input (web fallback)
- **Validation**: Automatically validates selected JSON files against the current schema
- **Duplicate Prevention**: Prevents adding the same file multiple times to the same schema
- **Error Handling**: Provides user-friendly error messages for invalid files or failed operations

### 3. Persistence to Disk
- **Electron Mode**: Saves schema associations to `schema-associations.json` in the config directory
- **Web Mode**: Falls back to localStorage for persistence
- **Data Structure**: Stores schema path, name, and associated file information including validation status

### 4. Loading on Startup
- **Automatic Loading**: Loads previously saved associations when the app starts
- **File Re-validation**: Re-validates associated files against current schemas
- **Graceful Degradation**: Continues to work even if some previously associated files are no longer accessible

## Technical Implementation

### Components Modified
- `src/components/MiddlePanel.vue`: Added the "Add File" button and click handler

### Store Functions Added
- `addJsonFile(schema: SchemaInfo)`: Main function to add a JSON file to a schema
- `saveSchemaAssociations()`: Persists schema associations to disk/localStorage
- `loadSchemaAssociations()`: Loads schema associations on startup

### Key Features
- **Cross-platform**: Works in both Electron and web environments
- **Validation**: Automatic JSON schema validation for added files
- **Persistence**: Reliable data persistence with fallback mechanisms
- **Error Handling**: Comprehensive error handling with user feedback
- **Performance**: Efficient file loading and validation

## Usage

1. **Select a Schema**: Choose a JSON schema from the left panel
2. **Add JSON File**: Click the "Add File" button in the Associated JSON Files panel
3. **Choose File**: Select a JSON file from the file dialog
4. **Automatic Validation**: The file is automatically validated against the selected schema
5. **Persistence**: The association is automatically saved and will be restored when the app reopens

## File Structure

```
Associated JSON Files Panel
├── Header
│   ├── Title: "Associated JSON Files"
│   └── Add File Button (when schema selected)
├── Schema Info
└── File List
    ├── Valid Files (green indicator)
    └── Invalid Files (red indicator with error count)
```

## Error Handling

- **Invalid JSON**: Shows "Invalid JSON file format" error
- **Duplicate Files**: Shows "This file is already associated with the schema" error
- **File Read Errors**: Shows specific error messages for file access issues
- **Schema Validation**: Shows validation status with error count for invalid files

## Persistence Details

### Electron Mode
- **Location**: Config directory (platform-specific)
- **File**: `schema-associations.json`
- **Format**: JSON array with schema associations

### Web Mode
- **Location**: Browser localStorage
- **Key**: `schema-associations`
- **Format**: JSON string with schema associations

## Future Enhancements

Potential improvements that could be added:
1. Drag and drop support for adding files
2. Bulk file addition
3. File watching for automatic re-validation
4. Export/import of schema associations
5. File preview in the right panel