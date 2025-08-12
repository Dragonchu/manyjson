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
let isEditMode = false;
let originalJsonContent = null;

// DOM Elements
const schemaTree = document.getElementById('schemaTree');
const jsonFilesList = document.getElementById('jsonFilesList');
const jsonViewer = document.getElementById('jsonViewer');
const jsonEditor = document.getElementById('jsonEditor');
const schemaInfo = document.getElementById('schemaInfo');
const rightPanelTitle = document.getElementById('rightPanelTitle');
const validationStatus = document.getElementById('validationStatus');
const statusBar = document.getElementById('statusBar');
const contextMenu = document.getElementById('contextMenu');

// Buttons
const addSchemaBtn = document.getElementById('addSchemaBtn');
const refreshBtn = document.getElementById('refreshBtn');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const editModeBtn = document.getElementById('editModeBtn');
const saveJsonBtn = document.getElementById('saveJsonBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

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
          jsonFile.analyzedErrors = analyzeValidationErrors(compiledSchema.errors, schema.content, jsonFile.content);
        } else {
          jsonFile.errors = null;
          jsonFile.analyzedErrors = null;
        }
      }
    }
  }
}

// Intelligent validation error analyzer
function analyzeValidationErrors(ajvErrors, schema, data) {
  const analysis = {
    summary: {
      total: ajvErrors.length,
      critical: 0,
      warnings: 0
    },
    categories: {
      missingFields: [],
      extraFields: [],
      typeMismatches: [],
      otherErrors: []
    }
  };

  for (const error of ajvErrors) {
    const analyzedError = analyzeIndividualError(error, schema, data);
    
    // Categorize errors
    switch (analyzedError.category) {
      case 'missing':
        analysis.categories.missingFields.push(analyzedError);
        analysis.summary.critical++;
        break;
      case 'extra':
        analysis.categories.extraFields.push(analyzedError);
        analysis.summary.warnings++;
        break;
      case 'type':
        analysis.categories.typeMismatches.push(analyzedError);
        analysis.summary.critical++;
        break;
      default:
        analysis.categories.otherErrors.push(analyzedError);
        analysis.summary.critical++;
        break;
    }
  }

  return analysis;
}

// Analyze individual validation error
function analyzeIndividualError(error, schema, data) {
  const analyzed = {
    original: error,
    category: 'other',
    severity: 'critical',
    path: error.instancePath || 'root',
    message: '',
    details: {},
    suggestions: []
  };

  switch (error.keyword) {
    case 'required':
      analyzed.category = 'missing';
      analyzed.severity = 'critical';
      analyzed.message = `Required field '${error.params.missingProperty}' is missing`;
      analyzed.details = {
        missingField: error.params.missingProperty,
        location: analyzed.path,
        schemaRequirement: getSchemaRequirement(schema, analyzed.path, error.params.missingProperty)
      };
      analyzed.suggestions = [
        `Add the required field '${error.params.missingProperty}'`,
        `Check if the field name is spelled correctly`
      ];
      break;

    case 'additionalProperties':
      analyzed.category = 'extra';
      analyzed.severity = 'warning';
      analyzed.message = `Unexpected field '${error.params.additionalProperty}' found`;
      analyzed.details = {
        extraField: error.params.additionalProperty,
        location: analyzed.path,
        allowedFields: getAllowedFields(schema, analyzed.path)
      };
      analyzed.suggestions = [
        `Remove the extra field '${error.params.additionalProperty}'`,
        `Check if this field belongs to a different object`,
        `Update the schema to allow this field if it's intentional`
      ];
      break;

    case 'type':
      analyzed.category = 'type';
      analyzed.severity = 'critical';
      const expectedType = Array.isArray(error.schema) ? error.schema.join(' or ') : error.schema;
      const actualType = getActualType(data, analyzed.path);
      analyzed.message = `Type mismatch: expected ${expectedType}, got ${actualType}`;
      analyzed.details = {
        expectedType: expectedType,
        actualType: actualType,
        location: analyzed.path,
        value: getValueAtPath(data, analyzed.path)
      };
      analyzed.suggestions = [
        `Convert the value to ${expectedType} type`,
        `Check if the data structure is correct`,
        `Verify the field contains the expected data format`
      ];
      break;

    case 'enum':
      analyzed.category = 'type';
      analyzed.severity = 'critical';
      analyzed.message = `Invalid value: must be one of ${error.schema.join(', ')}`;
      analyzed.details = {
        allowedValues: error.schema,
        actualValue: error.data,
        location: analyzed.path
      };
      analyzed.suggestions = [
        `Use one of the allowed values: ${error.schema.join(', ')}`,
        `Check for typos in the value`
      ];
      break;

    case 'format':
      analyzed.category = 'type';
      analyzed.severity = 'critical';
      analyzed.message = `Invalid format: expected ${error.schema} format`;
      analyzed.details = {
        expectedFormat: error.schema,
        actualValue: error.data,
        location: analyzed.path
      };
      analyzed.suggestions = [
        `Ensure the value matches the ${error.schema} format`,
        `Check the value for correct syntax`
      ];
      break;

    case 'minimum':
    case 'maximum':
      analyzed.category = 'type';
      analyzed.severity = 'critical';
      const comparison = error.keyword === 'minimum' ? 'at least' : 'at most';
      analyzed.message = `Value must be ${comparison} ${error.schema}`;
      analyzed.details = {
        limit: error.schema,
        actualValue: error.data,
        location: analyzed.path
      };
      break;

    default:
      analyzed.message = error.message || 'Unknown validation error';
      analyzed.details = {
        keyword: error.keyword,
        schema: error.schema,
        data: error.data,
        location: analyzed.path
      };
      break;
  }

  return analyzed;
}

// Helper functions for error analysis
function getSchemaRequirement(schema, path, fieldName) {
  try {
    const schemaAtPath = getSchemaAtPath(schema, path);
    if (schemaAtPath && schemaAtPath.properties && schemaAtPath.properties[fieldName]) {
      return {
        type: schemaAtPath.properties[fieldName].type,
        description: schemaAtPath.properties[fieldName].description
      };
    }
  } catch (e) {
    // Ignore errors in schema traversal
  }
  return null;
}

function getAllowedFields(schema, path) {
  try {
    const schemaAtPath = getSchemaAtPath(schema, path);
    if (schemaAtPath && schemaAtPath.properties) {
      return Object.keys(schemaAtPath.properties);
    }
  } catch (e) {
    // Ignore errors in schema traversal
  }
  return [];
}

function getSchemaAtPath(schema, path) {
  if (!path || path === 'root') return schema;
  
  const pathParts = path.split('/').filter(part => part !== '');
  let current = schema;
  
  for (const part of pathParts) {
    if (current.properties && current.properties[part]) {
      current = current.properties[part];
    } else if (current.items) {
      current = current.items;
    } else {
      return null;
    }
  }
  
  return current;
}

function getActualType(data, path) {
  const value = getValueAtPath(data, path);
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getValueAtPath(data, path) {
  if (!path || path === 'root') return data;
  
  const pathParts = path.split('/').filter(part => part !== '');
  let current = data;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Render intelligent validation analysis
function renderValidationAnalysis(analysis) {
  const { summary, categories } = analysis;
  
  let html = '<div class="validation-errors">';
  
  // Header with summary
  html += `
    <div class="validation-errors-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      Validation Failed - ${summary.total} issue${summary.total > 1 ? 's' : ''} found
      <div class="validation-summary">
        ${summary.critical > 0 ? `
          <div class="summary-stat">
            <svg class="summary-stat-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            ${summary.critical} critical
          </div>
        ` : ''}
        ${summary.warnings > 0 ? `
          <div class="summary-stat">
            <svg class="summary-stat-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            ${summary.warnings} warnings
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  html += '<div class="validation-errors-content">';
  
  // Missing Fields Category
  if (categories.missingFields.length > 0) {
    html += renderErrorCategory(
      'missing-fields',
      'Missing Required Fields',
      'critical',
      categories.missingFields,
      `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `
    );
  }
  
  // Type Mismatches Category
  if (categories.typeMismatches.length > 0) {
    html += renderErrorCategory(
      'type-mismatches',
      'Type Mismatches',
      'critical',
      categories.typeMismatches,
      `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
        </svg>
      `
    );
  }
  
  // Extra Fields Category
  if (categories.extraFields.length > 0) {
    html += renderErrorCategory(
      'extra-fields',
      'Unexpected Fields',
      'warning',
      categories.extraFields,
      `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `
    );
  }
  
  // Other Errors Category
  if (categories.otherErrors.length > 0) {
    html += renderErrorCategory(
      'other-errors',
      'Other Validation Errors',
      'critical',
      categories.otherErrors,
      `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `
    );
  }
  
  html += '</div></div>';
  
  return html;
}

// Render error category
function renderErrorCategory(categoryId, title, severity, errors, icon) {
  const severityClass = `error-severity-${severity}`;
  
  let html = `
    <div class="error-category" data-category="${categoryId}">
      <div class="error-category-header" onclick="toggleErrorCategory('${categoryId}')">
        <div class="error-category-title">
          <span class="${severityClass}">${icon}</span>
          <span class="${severityClass}">${title}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="error-count-badge">${errors.length}</span>
          <svg class="category-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </div>
      </div>
      <div class="error-category-content">
  `;
  
  for (const error of errors) {
    html += renderErrorItem(error);
  }
  
  html += '</div></div>';
  
  return html;
}

// Render individual error item
function renderErrorItem(error) {
  const severityClass = error.severity === 'critical' ? 'critical' : 'warning';
  const icon = error.severity === 'critical' 
    ? `<svg class="error-icon ${severityClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"></circle>
         <line x1="15" y1="9" x2="9" y2="15"></line>
         <line x1="9" y1="9" x2="15" y2="15"></line>
       </svg>`
    : `<svg class="error-icon ${severityClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
         <line x1="12" y1="9" x2="12" y2="13"></line>
         <line x1="12" y1="17" x2="12.01" y2="17"></line>
       </svg>`;
  
  let html = `
    <div class="error-item">
      <div class="error-item-header">
        ${icon}
        <div class="error-message">
          ${error.message}
          ${error.path !== 'root' ? `<div class="error-path">Path: ${error.path}</div>` : ''}
        </div>
      </div>
  `;
  
  // Add detailed information based on error category
  if (error.category === 'type' && error.details.expectedType && error.details.actualType) {
    html += `
      <div class="error-details">
        <div class="type-comparison">
          <span class="type-expected">Expected: ${error.details.expectedType}</span>
          <span class="type-arrow">→</span>
          <span class="type-actual">Actual: ${error.details.actualType}</span>
        </div>
        ${error.details.value !== undefined ? `<div style="margin-top: 4px;">Current value: <code>${JSON.stringify(error.details.value)}</code></div>` : ''}
      </div>
    `;
  } else if (error.category === 'extra' && error.details.allowedFields) {
    html += `
      <div class="error-details">
        <div>Allowed fields: ${error.details.allowedFields.join(', ')}</div>
      </div>
    `;
  } else if (error.category === 'missing' && error.details.schemaRequirement) {
    html += `
      <div class="error-details">
        <div>Required type: ${error.details.schemaRequirement.type}</div>
        ${error.details.schemaRequirement.description ? `<div>Description: ${error.details.schemaRequirement.description}</div>` : ''}
      </div>
    `;
  }
  
  // Add suggestions
  if (error.suggestions && error.suggestions.length > 0) {
    html += `
      <div class="error-details">
        <div style="font-weight: 500; margin-bottom: 4px;">Suggestions:</div>
        ${error.suggestions.map(suggestion => `<div>• ${suggestion}</div>`).join('')}
      </div>
    `;
  }
  
  html += '</div>';
  
  return html;
}

// Setup error category expansion listeners
function setupErrorCategoryListeners() {
  // Remove existing listeners to prevent duplicates
  const existingListeners = document.querySelectorAll('.error-category-header');
  existingListeners.forEach(header => {
    header.replaceWith(header.cloneNode(true));
  });
}

// Toggle error category expansion
function toggleErrorCategory(categoryId) {
  const category = document.querySelector(`[data-category="${categoryId}"]`);
  if (category) {
    category.classList.toggle('expanded');
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
    
    let statusText = 'Not validated';
    let errorSummary = '';
    
    if (file.valid === true) {
      statusText = 'Valid';
    } else if (file.valid === false && file.analyzedErrors) {
      const analysis = file.analyzedErrors;
      statusText = 'Invalid';
      
      const criticalCount = analysis.summary.critical;
      const warningCount = analysis.summary.warnings;
      
      if (criticalCount > 0 && warningCount > 0) {
        errorSummary = `${criticalCount} errors, ${warningCount} warnings`;
      } else if (criticalCount > 0) {
        errorSummary = `${criticalCount} error${criticalCount > 1 ? 's' : ''}`;
      } else if (warningCount > 0) {
        errorSummary = `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
      }
    }
    
    html += `
      <div class="json-file-card ${isSelected ? 'selected' : ''} ${validClass}" data-file="${file.path}">
        <div class="json-file-name">${file.name}</div>
        <div class="json-file-status">
          <div class="status-icon ${statusIcon}"></div>
          <span class="status-${validClass}">${statusText}</span>
          ${errorSummary ? `<span class="error-summary">(${errorSummary})</span>` : ''}
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
    jsonEditor.style.display = 'none';
    jsonViewer.style.display = 'block';
    rightPanelTitle.textContent = 'JSON Content Viewer';
    validationStatus.innerHTML = '';
    updateEditButtons();
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
  
  if (isEditMode) {
    // Show editor
    jsonViewer.style.display = 'none';
    jsonEditor.style.display = 'block';
    
    if (fileData.content) {
      const jsonString = JSON.stringify(fileData.content, null, 2);
      jsonEditor.value = jsonString;
    }
  } else {
    // Show viewer
    jsonEditor.style.display = 'none';
    jsonViewer.style.display = 'block';
    
    // Render content
    let contentHtml = '';
    
    // Show intelligent validation analysis if any errors
    if (fileData.analyzedErrors && fileData.analyzedErrors.summary.total > 0) {
      contentHtml += renderValidationAnalysis(fileData.analyzedErrors);
    }
    
    // Show JSON content with syntax highlighting
    if (fileData.content) {
      const jsonString = JSON.stringify(fileData.content, null, 2);
      const highlightedJson = highlightJson(jsonString);
      contentHtml += highlightedJson;
    }
    
    jsonViewer.innerHTML = contentHtml;
    
    // Add event listeners for error category expansion
    setupErrorCategoryListeners();
  }
  
  updateEditButtons();
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

// Update edit button visibility
function updateEditButtons() {
  const hasFile = currentJsonFile !== null;
  
  copyJsonBtn.style.display = hasFile ? 'flex' : 'none';
  editModeBtn.style.display = hasFile && !isEditMode ? 'flex' : 'none';
  saveJsonBtn.style.display = hasFile && isEditMode ? 'flex' : 'none';
  cancelEditBtn.style.display = hasFile && isEditMode ? 'flex' : 'none';
}

// Enter edit mode
function enterEditMode() {
  if (!currentJsonFile) return;
  
  // Store original content for cancel functionality
  const fileData = getCurrentFileData();
  if (fileData && fileData.content) {
    originalJsonContent = JSON.stringify(fileData.content, null, 2);
  }
  
  isEditMode = true;
  renderJsonContent();
  showStatus('Edit mode enabled', 'info');
}

// Exit edit mode
function exitEditMode() {
  isEditMode = false;
  originalJsonContent = null;
  renderJsonContent();
}

// Save JSON changes
async function saveJsonChanges() {
  if (!currentJsonFile || !isEditMode) return;
  
  try {
    const jsonText = jsonEditor.value.trim();
    if (!jsonText) {
      showStatus('Cannot save empty JSON', 'error');
      return;
    }
    
    // Validate JSON syntax
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (parseError) {
      showStatus(`Invalid JSON: ${parseError.message}`, 'error');
      return;
    }
    
    // Update the file data
    const fileData = getCurrentFileData();
    if (fileData) {
      fileData.content = parsedJson;
      
      // Re-validate against schema
      if (currentSchema && schemaData[currentSchema] && validator) {
        const compiledSchema = validator.compile(schemaData[currentSchema].content);
        fileData.valid = compiledSchema(parsedJson);
        if (!fileData.valid) {
          fileData.errors = compiledSchema.errors;
        } else {
          fileData.errors = null;
        }
      }
      
      // Here you would typically save to file system
      // For now, we'll just update the in-memory data
      showStatus('JSON saved successfully', 'success');
      
      exitEditMode();
      renderJsonFilesList(); // Update validation status in file list
    }
  } catch (error) {
    showStatus(`Save failed: ${error.message}`, 'error');
  }
}

// Cancel edit mode
function cancelEdit() {
  if (originalJsonContent) {
    jsonEditor.value = originalJsonContent;
  }
  exitEditMode();
  showStatus('Edit cancelled', 'info');
}

// Copy JSON to clipboard
async function copyJsonToClipboard() {
  if (!currentJsonFile) return;
  
  try {
    const fileData = getCurrentFileData();
    if (!fileData || !fileData.content) {
      showStatus('No content to copy', 'error');
      return;
    }
    
    const jsonString = JSON.stringify(fileData.content, null, 2);
    await navigator.clipboard.writeText(jsonString);
    showStatus('JSON copied to clipboard', 'success');
  } catch (error) {
    showStatus(`Copy failed: ${error.message}`, 'error');
  }
}

// Get current file data
function getCurrentFileData() {
  if (!currentJsonFile) return null;
  
  for (const schemaId in jsonFiles) {
    const file = jsonFiles[schemaId].find(f => f.path === currentJsonFile);
    if (file) {
      return file;
    }
  }
  return null;
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
  
  // JSON editor buttons
  copyJsonBtn.addEventListener('click', copyJsonToClipboard);
  editModeBtn.addEventListener('click', enterEditMode);
  saveJsonBtn.addEventListener('click', saveJsonChanges);
  cancelEditBtn.addEventListener('click', cancelEdit);
  
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
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'c':
        if (!isEditMode && currentJsonFile) {
          e.preventDefault();
          copyJsonToClipboard();
        }
        break;
      case 'e':
        if (!isEditMode && currentJsonFile) {
          e.preventDefault();
          enterEditMode();
        }
        break;
      case 's':
        if (isEditMode) {
          e.preventDefault();
          saveJsonChanges();
        }
        break;
    }
  }
  
  // Escape key to cancel edit
  if (e.key === 'Escape' && isEditMode) {
    cancelEdit();
  }
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
  // Exit edit mode when selecting a different file
  if (isEditMode) {
    exitEditMode();
  }
  
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

// Global functions for HTML onclick
window.toggleErrorCategory = toggleErrorCategory;

// App info display
if (window.appInfo) {
  console.log(`${window.appInfo.name} v${window.appInfo.version}`);
}