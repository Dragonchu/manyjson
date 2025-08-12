# ManyJson - JSON Schema Manager

A professional three-column JSON Schema management application built with Electron, featuring real-time validation, intuitive navigation, and modern Linear Design System aesthetics.

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

- **Framework**: Electron 28
- **Validation**: AJV (JSON Schema validator)
- **Architecture**: Three-column responsive layout
- **Design System**: Linear-inspired dark theme
- **File System**: Native Node.js file operations

## 📁 Project Structure

```
├── src/
│   ├── index.html          # Main HTML with three-column layout
│   ├── renderer.js         # Frontend application logic
│   ├── main.js            # Electron main process
│   └── preload.js         # Secure API bridge
├── *.json                 # Sample JSON files and schemas
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd manyjson-electron

# Install dependencies
npm install

# Start the application
npm start
```

### Development
```bash
# Start in development mode
npm run dev

# Clean build artifacts
npm run clean
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
- Panels have minimum and maximum width constraints
- Layout adapts automatically on smaller screens

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + C**: Copy JSON to clipboard (view mode)
- **Ctrl/Cmd + E**: Enter edit mode
- **Ctrl/Cmd + S**: Save changes (edit mode)
- **Escape**: Cancel edit mode

## 🔧 Configuration

### Sample Data
The application includes sample schemas and JSON files:

- `user-schema.json`: User data validation schema
- `product-schema.json`: Product data validation schema
- `user-data-1.json`: Valid user data
- `user-data-invalid.json`: Invalid user data (for testing)
- `product-data-1.json`: Valid product data
- `demo-data.json`: Demo application data
- `test-data.json`: Test data file

### Adding New Schemas
1. Create a JSON Schema file in the root directory
2. Update the `schemaData` object in `renderer.js`
3. Add associated JSON files to the `jsonFiles` mapping

### Validation Rules
- Uses AJV with `allErrors: true` for comprehensive validation
- Supports JSON Schema Draft 7
- Real-time validation on file selection
- Detailed error reporting with instance paths

## 🎨 Design System

### Color Palette
- **Primary Background**: `#0a0a0a`
- **Secondary Background**: `#111111`
- **Surface**: `rgba(255, 255, 255, 0.02)`
- **Accent**: `#6366f1` (Indigo)
- **Success**: `#10b981` (Emerald)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Amber)

### Typography
- **Primary Font**: Inter, system fonts
- **Monospace Font**: JetBrains Mono, SF Mono, Monaco

### Components
- **Tree Items**: Hierarchical file browser
- **File Cards**: Status-aware file representations
- **Status Indicators**: Visual validation feedback
- **Context Menus**: Right-click interaction panels
- **Resize Handles**: Panel width adjustment

## 🔍 Validation Features

### Intelligent Schema Validation
- Comprehensive JSON Schema validation using AJV
- Support for all JSON Schema keywords
- **Smart Error Analysis**: Deep parsing and categorization of validation errors
- Real-time validation on file selection with instant feedback

### Advanced Error Analysis
- **Error Categorization**: Automatically categorizes errors into three main types:
  - 🔴 **Missing Required Fields**: Critical errors for absent mandatory fields
  - 🔴 **Type Mismatches**: Critical errors for incorrect data types
  - 🟡 **Extra Fields**: Warning-level issues for unexpected additional fields
- **Detailed Error Information**: Each error includes:
  - Precise error location (JSON path)
  - Expected vs actual type comparison
  - Contextual suggestions for fixing
  - Schema requirement details

### Visual Error Display
- **Color-Coded Severity System**:
  - 🔴 **Red**: Critical errors (missing fields, type mismatches)
  - 🟡 **Yellow**: Warnings (extra fields, minor issues)
- **Expandable Error Categories**: Organized display with collapsible sections
- **Error Summary Statistics**: Quick overview of total issues
- **Interactive Error Panel**: Click to expand/collapse error details

### Error Details & Suggestions
- **Path-based Error Location**: Shows exact JSON path where errors occur
- **Type Comparison Display**: Visual comparison of expected vs actual types
- **Intelligent Suggestions**: Context-aware recommendations for fixing errors
- **Schema Context**: Shows relevant schema requirements for each field

### Validation States
- **Valid**: Green indicators, no errors detected
- **Invalid**: Red indicators with detailed error breakdown
- **Critical vs Warning**: Distinguished error severity levels
- **Not Validated**: Neutral state for unprocessed files

## ✏️ JSON Editing Features

### Edit Mode
- **Toggle Edit**: Click the edit button (✏️) or press Ctrl/Cmd + E
- **Syntax Highlighting**: Full JSON syntax highlighting in edit mode
- **Real-time Validation**: Instant validation feedback while typing
- **Auto-formatting**: Proper JSON indentation and structure

### Save & Cancel
- **Save Changes**: Click save button (💾) or press Ctrl/Cmd + S
- **Cancel Edit**: Click cancel button (❌) or press Escape
- **Validation on Save**: Automatic JSON syntax and schema validation
- **Error Prevention**: Cannot save invalid JSON syntax

### Copy Functionality
- **One-click Copy**: Click copy button (📋) or press Ctrl/Cmd + C
- **Formatted Output**: Copies properly formatted JSON with 2-space indentation
- **Visual Feedback**: Success/error messages for copy operations
- **Clipboard Integration**: Uses native clipboard API for reliable copying

## 🧠 Intelligent Validation Analyzer

### Deep Error Analysis Engine
The application features a sophisticated validation analyzer that goes beyond simple pass/fail results. When JSON validation fails, the system provides comprehensive error analysis with:

### Three-Tier Error Classification
1. **🔴 Critical Errors** (Red indicators):
   - **Missing Required Fields**: Identifies absent mandatory properties
   - **Type Mismatches**: Detects incorrect data types with expected vs actual comparison
   - **Format Violations**: Catches invalid formats (email, date, etc.)
   - **Value Constraints**: Reports minimum/maximum violations

2. **🟡 Warnings** (Yellow indicators):
   - **Extra Fields**: Identifies unexpected additional properties
   - **Schema Violations**: Non-critical schema constraint issues

3. **ℹ️ Contextual Information**:
   - **Error Location**: Precise JSON path showing where issues occur
   - **Fix Suggestions**: Intelligent recommendations for resolving each error
   - **Schema Context**: Relevant schema requirements and descriptions

### Interactive Error Display
- **Expandable Categories**: Click to expand/collapse error groups
- **Detailed Error Items**: Each error shows:
  - Clear error message and description
  - JSON path location (e.g., `/user/address/zipCode`)
  - Expected vs actual type comparison
  - Current value causing the error
  - Step-by-step fixing suggestions
- **Error Summary**: Quick statistics showing critical errors vs warnings
- **Visual Hierarchy**: Color-coded icons and badges for easy scanning

### Smart Error Messages
Instead of cryptic validation messages, the analyzer provides human-readable explanations:
- ❌ `"Missing required field 'email'"` with detailed field requirements
- ❌ `"Wrong data type: expected string, but got number"` with visual type comparison
- ⚠️ `"Unexpected field 'extraProperty' is not allowed"` with list of allowed fields
- 🔧 Context-specific fix suggestions for each error type

### Error Prevention & Guidance
- **Proactive Suggestions**: Context-aware recommendations for each error type
- **Schema Insights**: Shows what the schema expects for each field
- **Field Requirements**: Displays type, format, and constraint information
- **Best Practices**: Guides users toward correct JSON structure

### Example: Intelligent Error Analysis

When validating this invalid user data against a user schema:

```json
{
  "name": "",
  "email": "invalid-email",
  "age": -5,
  "isActive": "yes",
  "address": {
    "street": "123 Main St"
  },
  "tags": ["developer", "developer"],
  "extraField": "not allowed"
}
```

The analyzer provides detailed categorized feedback:

**🔴 Missing Required Fields (1 critical error)**
- Required field 'city' is missing in address object
  - Path: `/address`
  - Expected type: `string`
  - Suggestion: Add the required field 'city' to the address object

**🔴 Type Mismatches (3 critical errors)**
- Type mismatch: expected string with minLength 1, got empty string
  - Path: `/name`
  - Expected: `string (min length: 1)` → Actual: `string (empty)`
  - Suggestion: Provide a non-empty string for the name field

- Invalid format: expected email format
  - Path: `/email`
  - Expected format: `email`
  - Current value: `"invalid-email"`
  - Suggestion: Ensure the value matches the email format

- Type mismatch: expected boolean, got string
  - Path: `/isActive`
  - Expected: `boolean` → Actual: `string`
  - Current value: `"yes"`
  - Suggestion: Use true or false instead of string values

**🟡 Unexpected Fields (1 warning)**
- Unexpected field 'extraField' found
  - Path: `/extraField`
  - Allowed fields: name, email, age, isActive, address, tags
  - Suggestion: Remove the extra field or update schema to allow it

## 📱 Responsive Design

### Breakpoints
- **Desktop** (>1024px): Full three-column layout
- **Tablet** (768px-1024px): Reduced panel widths
- **Mobile** (<768px): Stacked vertical layout

### Mobile Adaptations
- Panels stack vertically on small screens
- Touch-friendly interaction targets
- Optimized spacing and typography
- Collapsible navigation elements

## 🛡️ Security

### Electron Security
- Context isolation enabled
- Sandbox mode active
- No direct Node.js access from renderer
- Secure IPC communication via preload scripts

### File Access
- Controlled file system access
- JSON parsing with error handling
- Path validation and sanitization
- Read-only file operations for safety

## 🚧 Future Enhancements

### Planned Features
- [ ] Schema editor with live preview
- [ ] File system browser integration
- [ ] Schema validation rule builder
- [ ] Export/import functionality
- [ ] Multi-schema validation
- [ ] Plugin architecture
- [ ] Themes and customization
- [ ] Advanced search and filtering

### Technical Improvements
- [ ] TypeScript migration
- [ ] Unit test coverage
- [ ] Performance optimizations
- [ ] Better error handling
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review sample code and examples

---

**ManyJson** - Professional JSON Schema Management Made Simple