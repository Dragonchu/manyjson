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
- ✅ **Context Menus**: Right-click operations for schema management
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Resizable Panels**: Drag handles to adjust panel widths

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

### Panel Resizing
- Drag the vertical dividers between panels to adjust widths
- Panels have minimum and maximum width constraints
- Layout adapts automatically on smaller screens

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

### Schema Validation
- Comprehensive JSON Schema validation using AJV
- Support for all JSON Schema keywords
- Custom error messages and detailed reporting
- Real-time validation on file selection

### Error Reporting
- Instance path indication (shows where errors occur)
- Human-readable error messages
- Error count display in file cards
- Visual error highlighting

### Validation States
- **Valid**: Green indicators, no errors
- **Invalid**: Red indicators, error details shown
- **Not Validated**: Neutral state for unprocessed files

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