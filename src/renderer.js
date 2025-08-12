/*
  JSON Schema Manager - Three Column Layout
  - Left Panel: Schema management with tree structure
  - Middle Panel: JSON files associated with selected schema
  - Right Panel: JSON content viewer with validation
*/

// Global state
let currentSchema = null;
let currentJsonFile = null;
let schemaData = {};
let jsonFiles = {};
let validator = null;

// DOM Elements
const schemaTree = document.getElementById('schemaTree');
const jsonFilesList = document.getElementById('jsonFilesList');
const jsonViewer = document.getElementById('jsonViewer');
const schemaInfo = document.getElementById('schemaInfo');
const rightPanelTitle = document.getElementById('rightPanelTitle');
const validationStatus = document.getElementById('validationStatus');
const statusBar = document.getElementById('statusBar');
const contextMenu = document.getElementById('contextMenu');

// Buttons
const addSchemaBtn = document.getElementById('addSchemaBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize the application
async function initializeApp() {
  try {
    // Load AJV for JSON Schema validation
    if (typeof window !== 'undefined' && window.require) {
      const Ajv = window.require('ajv');
      validator = new Ajv({ allErrors: true, verbose: true });
    }
    
    await loadSchemas();
    await loadJsonFiles();
    renderSchemaTree();
    setupEventListeners();
    showStatus('Application initialized successfully', 'success');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showStatus('Failed to initialize application', 'error');
  }
}

// Load all schema files
async function loadSchemas() {
  try {
    // In a real application, this would load from file system
    // For demo purposes, we'll use predefined schemas
    schemaData = {
      'user-schema': {
        name: 'User Schema',
        path: 'user-schema.json',
        content: await loadJsonFile('user-schema.json'),
        folder: 'Users'
      },
      'product-schema': {
        name: 'Product Schema', 
        path: 'product-schema.json',
        content: await loadJsonFile('product-schema.json'),
        folder: 'Products'
      }
    };
  } catch (error) {
    console.error('Failed to load schemas:', error);
    schemaData = {};
  }
}

// Load all JSON files and associate with schemas
async function loadJsonFiles() {
  try {
    jsonFiles = {
      'user-schema': [
        {
          name: 'user-data-1.json',
          path: 'user-data-1.json',
          content: await loadJsonFile('user-data-1.json'),
          valid: null
        },
        {
          name: 'user-data-invalid.json', 
          path: 'user-data-invalid.json',
          content: await loadJsonFile('user-data-invalid.json'),
          valid: null
        },
        {
          name: 'demo-data.json',
          path: 'demo-data.json', 
          content: await loadJsonFile('demo-data.json'),
          valid: null
        }
      ],
      'product-schema': [
        {
          name: 'product-data-1.json',
          path: 'product-data-1.json',
          content: await loadJsonFile('product-data-1.json'),
          valid: null
        },
        {
          name: 'test-data.json',
          path: 'test-data.json',
          content: await loadJsonFile('test-data.json'), 
          valid: null
        }
      ]
    };
    
    // Validate all JSON files against their schemas
    await validateAllFiles();
  } catch (error) {
    console.error('Failed to load JSON files:', error);
    jsonFiles = {};
  }
}

// Load a JSON file (simulated file system access)
async function loadJsonFile(filename) {
  try {
    // In Electron, we would use fs.readFile
    // For demo, we'll simulate loading from the actual files
    if (window.electronAPI && window.electronAPI.readFile) {
      return await window.electronAPI.readFile(filename);
    }
    
    // Fallback: fetch from current directory
    const response = await fetch(filename);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error);
    return null;
  }
}

// Validate all JSON files against their associated schemas
async function validateAllFiles() {
  if (!validator) return;
  
  for (const schemaId in jsonFiles) {
    const schema = schemaData[schemaId];
    if (!schema || !schema.content) continue;
    
    const compiledSchema = validator.compile(schema.content);
    
    for (const jsonFile of jsonFiles[schemaId]) {
      if (jsonFile.content) {
        jsonFile.valid = compiledSchema(jsonFile.content);
        if (!jsonFile.valid) {
          jsonFile.errors = compiledSchema.errors;
        }
      }
    }
  }
}

// Render the schema tree in the left panel
function renderSchemaTree() {
  const folders = {};
  
  // Group schemas by folder
  for (const schemaId in schemaData) {
    const schema = schemaData[schemaId];
    const folderName = schema.folder || 'General';
    
    if (!folders[folderName]) {
      folders[folderName] = [];
    }
    folders[folderName].push({ id: schemaId, ...schema });
  }
  
  // Render tree
  let html = '';
  for (const folderName in folders) {
    html += `
      <div class="tree-item folder expanded" data-folder="${folderName}">
        ${folderName}
      </div>
    `;
    
    for (const schema of folders[folderName]) {
      const isSelected = currentSchema === schema.id;
      html += `
        <div class="tree-item schema ${isSelected ? 'selected' : ''}" data-schema="${schema.id}">
          ${schema.name}
        </div>
      `;
    }
  }
  
  schemaTree.innerHTML = html;
}

// Render JSON files list in the middle panel
function renderJsonFilesList() {
  if (!currentSchema || !jsonFiles[currentSchema]) {
    jsonFilesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <div class="empty-state-title">No Schema Selected</div>
        <div class="empty-state-description">Select a JSON Schema from the left panel to view associated JSON files</div>
      </div>
    `;
    return;
  }
  
  const files = jsonFiles[currentSchema];
  const schema = schemaData[currentSchema];
  
  // Update schema info
  schemaInfo.textContent = `${files.length} files associated with ${schema.name}`;
  
  let html = '';
  for (const file of files) {
    const isSelected = currentJsonFile === file.path;
    const validClass = file.valid === true ? 'valid' : file.valid === false ? 'invalid' : '';
    const statusIcon = file.valid === true ? 'valid' : file.valid === false ? 'invalid' : '';
    const statusText = file.valid === true ? 'Valid' : file.valid === false ? 'Invalid' : 'Not validated';
    
    html += `
      <div class="json-file-card ${isSelected ? 'selected' : ''} ${validClass}" data-file="${file.path}">
        <div class="json-file-name">${file.name}</div>
        <div class="json-file-status">
          <div class="status-icon ${statusIcon}"></div>
          <span class="status-${validClass}">${statusText}</span>
          ${file.errors ? `(${file.errors.length} errors)` : ''}
        </div>
      </div>
    `;
  }
  
  jsonFilesList.innerHTML = html;
}

// Render JSON content in the right panel
function renderJsonContent() {
  if (!currentJsonFile) {
    jsonViewer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No JSON File Selected</div>
        <div class="empty-state-description">Select a JSON file from the middle panel to view its content and validation results</div>
      </div>
    `;
    rightPanelTitle.textContent = 'JSON Content Viewer';
    validationStatus.innerHTML = '';
    return;
  }
  
  // Find the current file data
  let fileData = null;
  for (const schemaId in jsonFiles) {
    const file = jsonFiles[schemaId].find(f => f.path === currentJsonFile);
    if (file) {
      fileData = file;
      break;
    }
  }
  
  if (!fileData) return;
  
  // Update header
  rightPanelTitle.textContent = fileData.name;
  
  // Update validation status
  let validationHtml = '';
  if (fileData.valid === true) {
    validationHtml = `
      <div class="status-icon valid"></div>
      <span class="status-valid">Valid JSON</span>
    `;
  } else if (fileData.valid === false) {
    validationHtml = `
      <div class="status-icon invalid"></div>
      <span class="status-invalid">Invalid JSON (${fileData.errors.length} errors)</span>
    `;
  } else {
    validationHtml = `
      <span class="status-pending">Not validated</span>
    `;
  }
  validationStatus.innerHTML = validationHtml;
  
  // Render content
  let contentHtml = '';
  
  // Show validation errors if any
  if (fileData.errors && fileData.errors.length > 0) {
    contentHtml += '<div class="validation-errors">';
    for (const error of fileData.errors) {
      contentHtml += `<div class="validation-error">• ${error.instancePath || 'root'}: ${error.message}</div>`;
    }
    contentHtml += '</div>';
  }
  
  // Show JSON content with syntax highlighting
  if (fileData.content) {
    const jsonString = JSON.stringify(fileData.content, null, 2);
    const highlightedJson = highlightJson(jsonString);
    contentHtml += highlightedJson;
  }
  
  jsonViewer.innerHTML = contentHtml;
}

// JSON syntax highlighting
function highlightJson(jsonString) {
  return jsonString
    .replace(/(".*?")(\s*:)/g, '<span class="json-key">$1</span>$2')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

// Setup event listeners
function setupEventListeners() {
  // Schema tree clicks
  schemaTree.addEventListener('click', (e) => {
    const schemaItem = e.target.closest('.tree-item.schema');
    const folderItem = e.target.closest('.tree-item.folder');
    
    if (schemaItem) {
      const schemaId = schemaItem.dataset.schema;
      selectSchema(schemaId);
    } else if (folderItem) {
      toggleFolder(folderItem);
    }
  });
  
  // JSON files list clicks
  jsonFilesList.addEventListener('click', (e) => {
    const fileCard = e.target.closest('.json-file-card');
    if (fileCard) {
      const filePath = fileCard.dataset.file;
      selectJsonFile(filePath);
    }
  });
  
  // Right-click context menu for schemas
  schemaTree.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const schemaItem = e.target.closest('.tree-item.schema');
    if (schemaItem) {
      showContextMenu(e.clientX, e.clientY, schemaItem.dataset.schema);
    }
  });
  
  // Hide context menu on click elsewhere
  document.addEventListener('click', () => {
    hideContextMenu();
  });
  
  // Button event listeners
  addSchemaBtn.addEventListener('click', () => {
    showStatus('Add schema functionality would be implemented here', 'info');
  });
  
  refreshBtn.addEventListener('click', async () => {
    showStatus('Refreshing schemas and files...', 'info');
    await loadSchemas();
    await loadJsonFiles();
    renderSchemaTree();
    renderJsonFilesList();
    renderJsonContent();
    showStatus('Refreshed successfully', 'success');
  });
  
  // Context menu actions
  document.getElementById('viewSchemaItem').addEventListener('click', () => {
    if (currentSchema) {
      viewSchema(currentSchema);
    }
    hideContextMenu();
  });
  
  document.getElementById('editSchemaItem').addEventListener('click', () => {
    if (currentSchema) {
      showStatus('Edit schema functionality would be implemented here', 'info');
    }
    hideContextMenu();
  });
  
  document.getElementById('deleteSchemaItem').addEventListener('click', () => {
    if (currentSchema) {
      showStatus('Delete schema functionality would be implemented here', 'info');
    }
    hideContextMenu();
  });
  
  // Resize handles
  setupResizeHandles();
}

// Select a schema
function selectSchema(schemaId) {
  currentSchema = schemaId;
  currentJsonFile = null;
  renderSchemaTree();
  renderJsonFilesList();
  renderJsonContent();
}

// Select a JSON file
function selectJsonFile(filePath) {
  currentJsonFile = filePath;
  renderJsonFilesList();
  renderJsonContent();
}

// Toggle folder expansion
function toggleFolder(folderElement) {
  folderElement.classList.toggle('expanded');
  folderElement.classList.toggle('collapsed');
}

// Show context menu
function showContextMenu(x, y, schemaId) {
  currentSchema = schemaId;
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.style.display = 'block';
}

// Hide context menu
function hideContextMenu() {
  contextMenu.style.display = 'none';
}

// View schema content
function viewSchema(schemaId) {
  const schema = schemaData[schemaId];
  if (schema && schema.content) {
    // Create a temporary view of the schema
    const jsonString = JSON.stringify(schema.content, null, 2);
    const highlightedJson = highlightJson(jsonString);
    
    jsonViewer.innerHTML = `
      <div style="margin-bottom: 16px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--linear-accent); border-radius: 6px;">
        <strong>Viewing Schema: ${schema.name}</strong>
      </div>
      ${highlightedJson}
    `;
    
    rightPanelTitle.textContent = `Schema: ${schema.name}`;
    validationStatus.innerHTML = '<span style="color: var(--linear-accent);">Schema Definition</span>';
  }
}

// Setup resize handles for panels
function setupResizeHandles() {
  const leftResize = document.getElementById('leftResize');
  const middleResize = document.getElementById('middleResize');
  const leftPanel = document.querySelector('.left-panel');
  const middlePanel = document.querySelector('.middle-panel');
  
  let isResizing = false;
  let currentHandle = null;
  
  function startResize(e, handle) {
    isResizing = true;
    currentHandle = handle;
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  }
  
  function doResize(e) {
    if (!isResizing) return;
    
    const containerRect = document.querySelector('.app-container').getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    
    if (currentHandle === leftResize) {
      const newWidth = Math.max(250, Math.min(400, mouseX));
      leftPanel.style.width = newWidth + 'px';
    } else if (currentHandle === middleResize) {
      const leftWidth = leftPanel.offsetWidth;
      const newWidth = Math.max(300, Math.min(500, mouseX - leftWidth - 4));
      middlePanel.style.width = newWidth + 'px';
    }
  }
  
  function stopResize() {
    isResizing = false;
    currentHandle = null;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
  }
  
  leftResize.addEventListener('mousedown', (e) => startResize(e, leftResize));
  middleResize.addEventListener('mousedown', (e) => startResize(e, middleResize));
}

// Show status message
function showStatus(message, type = 'info', duration = 3000) {
  statusBar.textContent = message;
  statusBar.className = `status-bar show ${type}`;
  
  setTimeout(() => {
    statusBar.classList.remove('show');
  }, duration);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// App info display
if (window.appInfo) {
  console.log(`${window.appInfo.name} v${window.appInfo.version}`);
}