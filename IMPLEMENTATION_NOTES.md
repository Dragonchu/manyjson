# View Schema Operation Implementation

## Summary

Successfully implemented the **View Schema** operation for the ManyJson Vue 3 application as requested in Linear issue MAN-14.

## What Was Implemented

### 1. Store State Management (`src/stores/app.ts`)
- Added `isViewingSchema` reactive state to track when schema viewing is active
- Added `setSchemaViewMode(enabled: boolean)` function to control schema viewing
- Updated existing state management functions to properly clear schema viewing mode when switching contexts

### 2. Context Menu Functionality (`src/components/ContextMenu.vue`)
- Implemented the `handleViewSchema()` function that was previously just a TODO placeholder
- The function now:
  - Sets the current schema
  - Enables schema viewing mode
  - Shows appropriate status message

### 3. Right Panel Display (`src/components/RightPanel.vue`)
- Updated the template to display schema content when in viewing mode
- Added conditional rendering logic:
  - Shows schema content with syntax highlighting when `isViewingSchema` is true
  - Displays schema-specific header and status indicators
  - Provides copy-to-clipboard functionality for schema content
- Added `copySchemaToClipboard()` function for copying schema definitions
- Added visual styling for schema viewing mode with appropriate colors and indicators

### 4. Testing
- Added comprehensive tests for the new functionality in `src/stores/__tests__/app.test.ts`
- Tests cover:
  - Schema view mode state management
  - Proper clearing of other states when enabling schema view
  - Integration with existing functionality
- All tests pass successfully

## How It Works

1. **User Interaction**: User right-clicks on a schema in the left panel
2. **Context Menu**: "View Schema" option appears in the context menu
3. **State Change**: Clicking triggers `handleViewSchema()` which:
   - Sets the current schema
   - Enables schema viewing mode
   - Clears any JSON file selection and edit mode
4. **Display**: Right panel switches to display the schema definition with:
   - Proper syntax highlighting
   - Schema-specific header ("Schema: [name]")
   - Blue accent styling to differentiate from JSON file viewing
   - Copy functionality for the schema content

## Key Features

- ✅ **Full Integration**: Works seamlessly with existing three-panel architecture
- ✅ **State Management**: Proper state isolation between schema viewing and JSON file viewing/editing
- ✅ **Visual Feedback**: Clear visual indicators when viewing schema vs JSON files
- ✅ **Copy Functionality**: Users can copy schema definitions to clipboard
- ✅ **Responsive Design**: Maintains the existing responsive layout
- ✅ **Type Safety**: Full TypeScript support with proper type definitions
- ✅ **Testing**: Comprehensive test coverage for the new functionality

## Technical Details

The implementation follows the existing patterns in the codebase:
- Uses Vue 3 Composition API with `<script setup>`
- Leverages Pinia for state management
- Maintains the same styling system (CSS variables and Linear Design System)
- Follows existing component architecture and data flow patterns

The View Schema operation is now fully functional and ready for production use.