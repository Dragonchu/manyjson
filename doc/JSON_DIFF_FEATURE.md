# JSON Diff Feature

## Overview

The JSON Diff feature allows users to visually compare changes between the original JSON file content and their modifications in the editing panel. This feature is particularly useful for:

- Reviewing changes before saving
- Understanding what modifications have been made
- Visual comparison of JSON structures
- Debugging JSON file changes

## How to Use

### Accessing Diff Mode

1. **Select a JSON file** from the middle panel
2. **Click the Edit button** (pencil icon) to enter edit mode
3. **Make changes** to the JSON content in the editor
4. **Click the Diff button** (split view icon) to enter diff mode

### Diff View Features

#### Side-by-Side View (Default)
- **Left panel**: Shows the original JSON content
- **Right panel**: Shows the modified JSON content
- **Visual highlighting**: Changes are highlighted for easy identification

#### Unified View
- **Single panel**: Shows a unified diff with additions and deletions
- **Line-by-line comparison**: 
  - Lines prefixed with `-` show removed content (red background)
  - Lines prefixed with `+` show added content (green background)
  - Unchanged lines have no prefix

#### View Toggle
- Click the **view mode button** in the diff header to switch between:
  - 📖 Side-by-side view
  - 📄 Unified view

### Navigation

- **Exit Diff Mode**: Click the ❌ button to return to edit mode
- **Save Changes**: Return to edit mode and click the save button
- **Cancel Edit**: Click cancel to discard all changes and return to view mode

## Technical Implementation

### Components

- **JsonDiffViewer**: Main diff visualization component
- **jsondiffpatch**: Library used for generating JSON diffs
- **UI Store**: Manages diff mode state

### Features

- **Smart Object Comparison**: Uses object hash for intelligent comparison
- **Array Move Detection**: Detects when array items are moved rather than deleted/added
- **Text Diff**: Provides character-level differences for long text values
- **Error Handling**: Gracefully handles invalid JSON content
- **Performance Optimized**: Efficient diff computation for large JSON files

### State Management

The diff feature integrates with the existing UI state management:

```typescript
// UI Store states
isDiffMode: boolean        // Whether diff mode is active
isEditMode: boolean       // Whether edit mode is active
originalFileContentForDiff // Stores original content for comparison
```

## Example Usage Scenarios

### Scenario 1: Modifying User Data

**Original JSON:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Modified JSON:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@company.com",
  "age": 31,
  "department": "Engineering"
}
```

**Diff View** will highlight:
- Changed email address
- Incremented age
- Added department field

### Scenario 2: Array Modifications

**Original JSON:**
```json
{
  "skills": ["JavaScript", "Python", "Java"],
  "projects": [
    {"name": "Project A", "status": "completed"},
    {"name": "Project B", "status": "in-progress"}
  ]
}
```

**Modified JSON:**
```json
{
  "skills": ["JavaScript", "Python", "TypeScript", "Go"],
  "projects": [
    {"name": "Project A", "status": "completed"},
    {"name": "Project B", "status": "completed"},
    {"name": "Project C", "status": "planning"}
  ]
}
```

**Diff View** will show:
- Array changes in skills (removed Java, added TypeScript and Go)
- Modified project status
- Added new project

## Benefits

1. **Visual Clarity**: Easy to see what has changed
2. **Error Prevention**: Review changes before saving
3. **Audit Trail**: Understand the scope of modifications
4. **User Experience**: Intuitive diff visualization
5. **Debugging**: Quickly identify unintended changes

## Keyboard Shortcuts

While in diff mode:
- **Escape**: Exit diff mode and return to edit mode
- **Ctrl/Cmd + S**: Save changes (returns to edit mode first)

## Limitations

- Diff is computed client-side and may be slower for very large JSON files (>10MB)
- Complex nested object changes may require careful review in unified view
- Text diffs within string values are shown at the line level, not character level

## Future Enhancements

Potential improvements for future versions:
- Character-level text diff highlighting
- Collapsible diff sections for large files
- Export diff as patch file
- Three-way merge support
- Diff history tracking