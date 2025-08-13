# Structured JSON File Storage System

## Overview

This document describes the enhanced JSON file storage system implemented to resolve Linear issue MJ-20. The system ensures that JSON files are properly persisted to disk and automatically loaded when the application is reopened, maintaining the connection between schemas and their associated JSON files.

## Directory Structure

The application now organizes files in a structured manner within the config directory:

```
userData/schemas/
├── schema1.json                    # Schema files (as before)
├── schema2.json
└── json-files/                     # New: Structured JSON file storage
    ├── schema1.json/               # Directory named after schema
    │   ├── data1.json
    │   ├── data2.json
    │   └── ...
    └── schema2.json/
        ├── product1.json
        ├── product2.json
        └── ...
```

## Key Features

### 1. Automatic Directory Creation
- When a JSON file is created for a schema, the system automatically creates a subdirectory named after the schema
- Directory names are sanitized (special characters replaced with underscores)
- Example: `"my schema.json"` becomes `"my_schema.json"`

### 2. Structured File Paths
- JSON files are saved to: `config/json-files/{schemaName}/{fileName}.json`
- Files are automatically associated with their parent schema
- Associations persist across application restarts

### 3. Automatic Loading
- When the application starts, it automatically loads:
  1. All schema files from the config directory
  2. All associated JSON files from their respective subdirectories
  3. Validates JSON files against their schemas
  4. Restores the complete schema-file associations

### 4. Backward Compatibility
- The system maintains compatibility with the existing schema association system
- Old-style associations are still loaded and respected
- Gradual migration from old system to new structured system

## Implementation Details

### New IPC Handlers (electron/main.ts)

#### `create-schema-json-directory`
Creates a directory for schema-specific JSON files.

#### `write-schema-json-file`
Saves a JSON file to the appropriate schema directory.
- **Parameters**: `schemaName`, `fileName`, `content`
- **Returns**: `{ success: boolean, filePath?: string, error?: string }`

#### `list-schema-json-files`
Lists all JSON files for a specific schema.
- **Parameters**: `schemaName`
- **Returns**: `{ success: boolean, files?: FileInfo[], error?: string }`

### New Store Functions (src/stores/app.ts)

#### `saveSchemaJsonFile(schemaName, fileName, content)`
High-level function to save JSON files using the structured system.

#### `loadSchemaJsonFiles(schemaName)`
Loads all JSON files associated with a specific schema.

### Updated Components

#### AddFilePopup.vue
- Now saves files to structured locations instead of prompting for save location
- Automatically creates the appropriate directory structure
- Files are immediately associated with their parent schema

#### App Store (loadSchemas)
- Enhanced to automatically load associated JSON files when schemas are loaded
- Maintains real-time validation of JSON files against their schemas

## Benefits

### 1. Persistent Associations
- JSON files and their schema associations survive application restarts
- No need to manually re-associate files

### 2. Organized Storage
- Clear, logical organization of files by schema
- Easy to locate and manage related files

### 3. Automatic Management
- No user intervention required for file organization
- Transparent to the user experience

### 4. Scalability
- System handles multiple schemas with multiple JSON files each
- Efficient loading and validation

## Migration Path

The system provides a smooth migration path:

1. **New Files**: All newly created JSON files use the structured system
2. **Existing Files**: Continue to work with the old association system
3. **Gradual Migration**: Users can gradually move to the new system as they create new files

## Error Handling

The system includes comprehensive error handling:
- Directory creation failures are handled gracefully
- File permission issues are reported clearly
- Corrupted files don't prevent the application from starting
- Missing directories are automatically recreated

## Testing

The implementation includes comprehensive testing:
- Directory structure creation and verification
- File saving and loading operations
- Schema name sanitization
- Association persistence and restoration
- Error condition handling

This structured approach ensures reliable, persistent JSON file management while maintaining a clean and intuitive user experience.