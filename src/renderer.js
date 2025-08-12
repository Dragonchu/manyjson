/*
  Enhanced JSON Editor with Advanced Features
  - Fixed-width line numbers with perfect alignment
  - Intelligent inline error detection with tooltips
  - Dark theme by default with high-contrast colors
  - Smooth scrolling and smart folding
  - Full mobile responsiveness
*/

let currentFilePath = null;
let isDarkTheme = true; // Default to dark theme
let isViewMode = false;
let showLineNumbers = true;
let autoFormat = true;
let smartFolding = true;
let errorMarkers = [];

// App info display
const appInfoEl = document.getElementById('appInfo');
if (window.appInfo && appInfoEl) {
  appInfoEl.textContent = `${window.appInfo.name} v${window.appInfo.version}`;
}

// DOM elements
const jsonEditor = document.getElementById('jsonEditor');
const jsonViewer = document.getElementById('jsonViewer');
const syntaxOverlay = document.getElementById('syntaxOverlay');
const errorOverlay = document.getElementById('errorOverlay');
const lineNumbers = document.getElementById('lineNumbers');
const codeEditorContainer = document.getElementById('codeEditorContainer');
const editorOptions = document.getElementById('editorOptions');
const showLineNumbersCheckbox = document.getElementById('showLineNumbers');
const autoFormatCheckbox = document.getElementById('autoFormat');
const smartFoldingCheckbox = document.getElementById('smartFolding');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');

// Buttons
const newBtn = document.getElementById('newBtn');
const openBtn = document.getElementById('openBtn');
const saveBtn = document.getElementById('saveBtn');
const formatBtn = document.getElementById('formatBtn');
const validateBtn = document.getElementById('validateBtn');
const themeBtn = document.getElementById('themeBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');
const clearBtn = document.getElementById('clearBtn');
const editModeBtn = document.getElementById('editModeBtn');
const viewModeBtn = document.getElementById('viewModeBtn');

// Enhanced status display with animations
function showStatus(message, type = 'success', duration = 3000) {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  status.style.opacity = '0';
  status.style.transform = 'translateY(-10px)';
  
  // Animate in
  requestAnimationFrame(() => {
    status.style.transition = 'all 0.3s ease';
    status.style.opacity = '1';
    status.style.transform = 'translateY(0)';
  });
  
  // Auto hide
  setTimeout(() => {
    status.style.opacity = '0';
    status.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      status.style.display = 'none';
    }, 300);
  }, duration);
}

// File info update
function updateFileInfo(filePath = null) {
  currentFilePath = filePath;
  if (filePath) {
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    fileInfo.innerHTML = `<strong>Current file:</strong> ${fileName} <span class="muted">(${filePath})</span>`;
  } else {
    fileInfo.innerHTML = '<strong>Status:</strong> <span class="muted">New unsaved file</span>';
  }
}

// Enhanced JSON tokenizer with error detection
function tokenizeJson(text) {
  const tokens = [];
  const errors = [];
  let currentPos = 0;
  let line = 1;
  let column = 1;
  
  const tokenPatterns = [
    { type: 'key', regex: /"([^"\\]|\\.)*"(?=\s*:)/, priority: 1 },
    { type: 'string', regex: /"([^"\\]|\\.)*"/, priority: 2 },
    { type: 'number', regex: /-?\d+\.?\d*([eE][+-]?\d+)?/, priority: 3 },
    { type: 'boolean', regex: /\b(true|false)\b/, priority: 4 },
    { type: 'null', regex: /\bnull\b/, priority: 5 },
    { type: 'brace', regex: /[{}\[\]]/, priority: 6 },
    { type: 'punctuation', regex: /[,:]/, priority: 7 },
    { type: 'whitespace', regex: /\s+/, priority: 8 },
    { type: 'comment', regex: /\/\/.*$|\/\*[\s\S]*?\*\//, priority: 9 },
    { type: 'error', regex: /./, priority: 10 }
  ];
  
  while (currentPos < text.length) {
    let matched = false;
    
    // Sort patterns by priority
    const sortedPatterns = tokenPatterns.sort((a, b) => a.priority - b.priority);
    
    for (const pattern of sortedPatterns) {
      const regex = new RegExp('^' + pattern.regex.source, pattern.regex.flags);
      const match = text.slice(currentPos).match(regex);
      
      if (match) {
        const tokenText = match[0];
        const token = {
          type: pattern.type,
          text: tokenText,
          start: currentPos,
          end: currentPos + tokenText.length,
          line: line,
          column: column
        };
        
        // Check for specific JSON syntax errors
        if (pattern.type === 'error' && !/\s/.test(tokenText)) {
          errors.push({
            message: `Unexpected character '${tokenText}'`,
            line: line,
            column: column,
            start: currentPos,
            end: currentPos + tokenText.length
          });
        }
        
        tokens.push(token);
        
        // Update position tracking
        for (let i = 0; i < tokenText.length; i++) {
          if (tokenText[i] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }
        
        currentPos += tokenText.length;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      currentPos++;
      column++;
    }
  }
  
  return { tokens, errors };
}

// Advanced JSON validation with detailed error reporting
function validateJsonWithErrors(text) {
  if (!text.trim()) {
    return { valid: true, errors: [] };
  }
  
  try {
    JSON.parse(text);
    return { valid: true, errors: [] };
  } catch (error) {
    const errors = [];
    const lines = text.split('\n');
    
    // Parse error message for line/column info
    const match = error.message.match(/at position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      let currentPos = 0;
      let line = 1;
      let column = 1;
      
      for (let i = 0; i < position && i < text.length; i++) {
        if (text[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        currentPos++;
      }
      
      errors.push({
        message: error.message,
        line: line,
        column: column,
        start: position,
        end: Math.min(position + 10, text.length)
      });
    } else {
      // Fallback error
      errors.push({
        message: error.message,
        line: 1,
        column: 1,
        start: 0,
        end: Math.min(50, text.length)
      });
    }
    
    return { valid: false, errors };
  }
}

// Generate line numbers with fixed width
function generateLineNumbers(text) {
  const lines = text.split('\n');
  const lineCount = lines.length;
  const maxDigits = lineCount.toString().length;
  let html = '';
  
  for (let i = 1; i <= lineCount; i++) {
    const lineNum = i.toString().padStart(maxDigits, ' ');
    html += lineNum + '\n';
  }
  
  return html;
}

// Enhanced syntax highlighting with error indicators
function highlightJsonText(text) {
  if (!text) return '';
  
  const { tokens, errors } = tokenizeJson(text);
  const validation = validateJsonWithErrors(text);
  
  // Combine tokenization and validation errors
  const allErrors = [...errors, ...validation.errors];
  errorMarkers = allErrors;
  
  let result = '';
  let lastEnd = 0;
  
  tokens.forEach(token => {
    // Add any text between tokens
    if (token.start > lastEnd) {
      result += escapeHtml(text.slice(lastEnd, token.start));
    }
    
    const escapedText = escapeHtml(token.text);
    
    // Check if this token has an error
    const hasError = allErrors.some(error => 
      error.start <= token.start && error.end >= token.end
    );
    
    let tokenHtml = '';
    switch (token.type) {
      case 'key':
        tokenHtml = `<span class="json-key">${escapedText}</span>`;
        break;
      case 'string':
        tokenHtml = `<span class="json-string">${escapedText}</span>`;
        break;
      case 'number':
        tokenHtml = `<span class="json-number">${escapedText}</span>`;
        break;
      case 'boolean':
        tokenHtml = `<span class="json-boolean">${escapedText}</span>`;
        break;
      case 'null':
        tokenHtml = `<span class="json-null">${escapedText}</span>`;
        break;
      case 'brace':
        tokenHtml = `<span class="json-brace">${escapedText}</span>`;
        break;
      case 'punctuation':
        tokenHtml = `<span class="json-punctuation">${escapedText}</span>`;
        break;
      case 'comment':
        tokenHtml = `<span class="json-comment">${escapedText}</span>`;
        break;
      default:
        tokenHtml = escapedText;
    }
    
    // Wrap with error indicator if needed
    if (hasError) {
      const error = allErrors.find(e => e.start <= token.start && e.end >= token.end);
      tokenHtml = `<span class="error-indicator">${tokenHtml}<span class="error-tooltip">${error.message}</span></span>`;
    }
    
    result += tokenHtml;
    lastEnd = token.end;
  });
  
  // Add any remaining text
  if (lastEnd < text.length) {
    result += escapeHtml(text.slice(lastEnd));
  }
  
  return result;
}

// HTML escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update editor highlighting with error detection
function updateEditorHighlight() {
  if (isViewMode) return;
  
  const text = jsonEditor.value;
  
  // Update syntax highlighting
  syntaxOverlay.innerHTML = highlightJsonText(text);
  
  // Update line numbers with fixed width
  if (showLineNumbers) {
    lineNumbers.innerHTML = generateLineNumbers(text || '\n');
  }
  
  // Auto-format if enabled
  if (autoFormat && text.trim()) {
    debounceAutoFormat();
  }
}

// Debounced auto-format
let autoFormatTimeout;
function debounceAutoFormat() {
  clearTimeout(autoFormatTimeout);
  autoFormatTimeout = setTimeout(() => {
    try {
      const parsed = JSON.parse(jsonEditor.value);
      const formatted = JSON.stringify(parsed, null, 2);
      if (formatted !== jsonEditor.value) {
        const cursorPos = jsonEditor.selectionStart;
        jsonEditor.value = formatted;
        jsonEditor.setSelectionRange(cursorPos, cursorPos);
        updateEditorHighlight();
      }
    } catch (e) {
      // Don't auto-format invalid JSON
    }
  }, 1000);
}

// Synchronized scrolling with smooth behavior
function syncScroll() {
  const scrollTop = jsonEditor.scrollTop;
  const scrollLeft = jsonEditor.scrollLeft;
  
  syntaxOverlay.scrollTop = scrollTop;
  syntaxOverlay.scrollLeft = scrollLeft;
  errorOverlay.scrollTop = scrollTop;
  errorOverlay.scrollLeft = scrollLeft;
  
  if (showLineNumbers) {
    lineNumbers.scrollTop = scrollTop;
  }
}

// Enhanced JSON viewer for preview mode
function highlightJson(jsonString, indent = 0) {
  try {
    const obj = JSON.parse(jsonString);
    return formatJsonWithHighlight(obj, indent);
  } catch (error) {
    return `<div class="status error">JSON Syntax Error: ${error.message}</div>`;
  }
}

// Recursive JSON formatter with smart folding
function formatJsonWithHighlight(obj, indent = 0, path = '') {
  if (obj === null) {
    return `<span class="json-null">null</span>`;
  }
  
  if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  }
  
  if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  }
  
  if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `<span class="json-brace">[]</span>`;
    }
    
    const arrayId = `array-${path.replace(/\./g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    const isCollapsed = smartFolding && obj.length > 10;
    
    let result = `<div class="json-line json-expandable ${isCollapsed ? 'json-collapsed' : ''}" data-path="${path}">`;
    result += `<span class="json-expand-icon" onclick="toggleExpand('${arrayId}')">${isCollapsed ? '▶' : '▼'}</span>`;
    result += `<span class="json-brace">[</span>`;
    if (isCollapsed) {
      result += `<span class="muted"> // ${obj.length} items</span>`;
    }
    result += `</div>`;
    
    result += `<div id="${arrayId}" class="json-content" ${isCollapsed ? 'style="display: none;"' : ''}>`;
    obj.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      result += `<div class="json-line" style="margin-left: ${(indent + 1) * 20}px;">`;
      result += formatJsonWithHighlight(item, indent + 1, itemPath);
      if (index < obj.length - 1) {
        result += `<span class="json-punctuation">,</span>`;
      }
      result += `</div>`;
    });
    result += `</div>`;
    
    result += `<div class="json-line" style="margin-left: ${indent * 20}px;">`;
    result += `<span class="json-brace">]</span>`;
    result += `</div>`;
    
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return `<span class="json-brace">{}</span>`;
    }
    
    const objectId = `object-${path.replace(/\./g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    const isCollapsed = smartFolding && keys.length > 15;
    
    let result = `<div class="json-line json-expandable ${isCollapsed ? 'json-collapsed' : ''}" data-path="${path}">`;
    result += `<span class="json-expand-icon" onclick="toggleExpand('${objectId}')">${isCollapsed ? '▶' : '▼'}</span>`;
    result += `<span class="json-brace">{</span>`;
    if (isCollapsed) {
      result += `<span class="muted"> // ${keys.length} properties</span>`;
    }
    result += `</div>`;
    
    result += `<div id="${objectId}" class="json-content" ${isCollapsed ? 'style="display: none;"' : ''}>`;
    keys.forEach((key, index) => {
      const keyPath = path ? `${path}.${key}` : key;
      result += `<div class="json-line" style="margin-left: ${(indent + 1) * 20}px;">`;
      result += `<span class="json-key">"${escapeHtml(key)}"</span>`;
      result += `<span class="json-punctuation">: </span>`;
      result += formatJsonWithHighlight(obj[key], indent + 1, keyPath);
      if (index < keys.length - 1) {
        result += `<span class="json-punctuation">,</span>`;
      }
      result += `</div>`;
    });
    result += `</div>`;
    
    result += `<div class="json-line" style="margin-left: ${indent * 20}px;">`;
    result += `<span class="json-brace">}</span>`;
    result += `</div>`;
    
    return result;
  }
  
  return String(obj);
}

// Toggle expand/collapse with animation
function toggleExpand(elementId) {
  const element = document.getElementById(elementId);
  const expandIcon = element.parentElement.querySelector('.json-expand-icon');
  const parentLine = element.parentElement;
  
  if (element.style.display === 'none') {
    element.style.display = 'block';
    expandIcon.textContent = '▼';
    parentLine.classList.remove('json-collapsed');
  } else {
    element.style.display = 'none';
    expandIcon.textContent = '▶';
    parentLine.classList.add('json-collapsed');
  }
}

// Expand/collapse all with smart detection
function expandAll() {
  const contents = jsonViewer.querySelectorAll('.json-content');
  const icons = jsonViewer.querySelectorAll('.json-expand-icon');
  const lines = jsonViewer.querySelectorAll('.json-expandable');
  
  contents.forEach(content => {
    content.style.display = 'block';
  });
  
  icons.forEach(icon => {
    icon.textContent = '▼';
  });
  
  lines.forEach(line => {
    line.classList.remove('json-collapsed');
  });
}

function collapseAll() {
  const contents = jsonViewer.querySelectorAll('.json-content');
  const icons = jsonViewer.querySelectorAll('.json-expand-icon');
  const lines = jsonViewer.querySelectorAll('.json-expandable');
  
  contents.forEach(content => {
    content.style.display = 'none';
  });
  
  icons.forEach(icon => {
    icon.textContent = '▶';
  });
  
  lines.forEach(line => {
    line.classList.add('json-collapsed');
  });
}

// Update JSON viewer
function updateJsonViewer() {
  const text = jsonEditor.value.trim();
  if (!text) {
    jsonViewer.innerHTML = '<div class="muted">No content to display</div>';
    return;
  }
  
  jsonViewer.innerHTML = highlightJson(text);
}

// Mode switching
function switchMode(mode) {
  isViewMode = mode === 'view';
  
  if (isViewMode) {
    codeEditorContainer.style.display = 'none';
    jsonViewer.style.display = 'block';
    editorOptions.style.display = 'none';
    editModeBtn.classList.remove('active');
    viewModeBtn.classList.add('active');
    updateJsonViewer();
  } else {
    codeEditorContainer.style.display = 'flex';
    jsonViewer.style.display = 'none';
    editorOptions.style.display = 'flex';
    editModeBtn.classList.add('active');
    viewModeBtn.classList.remove('active');
    updateEditorHighlight();
  }
}

// Theme switching (now toggles from dark to light)
function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  
  if (isDarkTheme) {
    document.body.style.background = '#0d1117';
    document.body.style.color = '#f0f6fc';
    document.body.classList.remove('light-theme');
    themeBtn.textContent = 'Light Theme';
  } else {
    document.body.style.background = '#ffffff';
    document.body.style.color = '#24292f';
    document.body.classList.add('light-theme');
    themeBtn.textContent = 'Dark Theme';
  }
  
  // Update displays
  if (isViewMode) {
    updateJsonViewer();
  } else {
    updateEditorHighlight();
  }
}

// Enhanced copy functionality
async function copyFormattedJson() {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('No content to copy', 'error');
      return;
    }
    
    const jsonData = JSON.parse(text);
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    await navigator.clipboard.writeText(formattedJson);
    showStatus('Formatted JSON copied to clipboard', 'success');
  } catch (error) {
    showStatus(`Copy failed: ${error.message}`, 'error');
  }
}

// Enhanced download functionality
function downloadJson() {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('No content to download', 'error');
      return;
    }
    
    const jsonData = JSON.parse(text);
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const fileName = currentFilePath ? 
      currentFilePath.split('/').pop() || currentFilePath.split('\\').pop() : 
      `json-export-${new Date().toISOString().split('T')[0]}.json`;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showStatus(`JSON file downloaded: ${fileName}`, 'success');
  } catch (error) {
    showStatus(`Download failed: ${error.message}`, 'error');
  }
}

// Clear editor with confirmation
function clearEditor() {
  if (jsonEditor.value.trim() && !confirm('Are you sure you want to clear all content?')) {
    return;
  }
  
  jsonEditor.value = '';
  updateFileInfo(null);
  if (isViewMode) {
    updateJsonViewer();
  } else {
    updateEditorHighlight();
  }
  showStatus('Editor cleared', 'info');
}

// Option toggles
function toggleLineNumbers() {
  showLineNumbers = showLineNumbersCheckbox.checked;
  const lineNumbersColumn = document.querySelector('.line-numbers-column');
  
  if (showLineNumbers) {
    lineNumbersColumn.style.display = 'block';
  } else {
    lineNumbersColumn.style.display = 'none';
  }
  
  updateEditorHighlight();
}

function toggleAutoFormat() {
  autoFormat = autoFormatCheckbox.checked;
  if (autoFormat) {
    showStatus('Auto-format enabled', 'info', 1500);
  } else {
    showStatus('Auto-format disabled', 'info', 1500);
  }
}

function toggleSmartFolding() {
  smartFolding = smartFoldingCheckbox.checked;
  if (smartFolding) {
    showStatus('Smart folding enabled', 'info', 1500);
  } else {
    showStatus('Smart folding disabled', 'info', 1500);
  }
  
  if (isViewMode) {
    updateJsonViewer();
  }
}

// Event Listeners
newBtn.addEventListener('click', () => {
  if (jsonEditor.value.trim() && !confirm('Create new file? Unsaved changes will be lost.')) {
    return;
  }
  
  jsonEditor.value = '';
  updateFileInfo(null);
  if (isViewMode) {
    updateJsonViewer();
  } else {
    updateEditorHighlight();
  }
  showStatus('New file created', 'success');
});

openBtn.addEventListener('click', async () => {
  try {
    const result = await window.jsonAPI.readFile();
    if (result.success) {
      jsonEditor.value = JSON.stringify(result.data, null, 2);
      updateFileInfo(result.filePath);
      if (isViewMode) {
        updateJsonViewer();
      } else {
        updateEditorHighlight();
      }
      showStatus(`File opened: ${result.filePath.split('/').pop() || result.filePath.split('\\').pop()}`, 'success');
    } else {
      showStatus(`Failed to open file: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Error opening file: ${error.message}`, 'error');
  }
});

saveBtn.addEventListener('click', async () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('No content to save', 'error');
      return;
    }

    // Validate JSON before saving
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      showStatus(`Invalid JSON: ${parseError.message}`, 'error');
      return;
    }

    const result = await window.jsonAPI.writeFile({
      filePath: currentFilePath,
      jsonData: jsonData
    });

    if (result.success) {
      updateFileInfo(result.filePath);
      showStatus(`File saved: ${result.filePath.split('/').pop() || result.filePath.split('\\').pop()}`, 'success');
    } else {
      showStatus(`Save failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Error saving file: ${error.message}`, 'error');
  }
});

formatBtn.addEventListener('click', () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('No content to format', 'error');
      return;
    }

    const jsonData = JSON.parse(text);
    jsonEditor.value = JSON.stringify(jsonData, null, 2);
    if (isViewMode) {
      updateJsonViewer();
    } else {
      updateEditorHighlight();
    }
    showStatus('JSON formatted successfully', 'success');
  } catch (error) {
    showStatus(`Format failed: ${error.message}`, 'error');
  }
});

validateBtn.addEventListener('click', () => {
  const text = jsonEditor.value.trim();
  if (!text) {
    showStatus('No content to validate', 'error');
    return;
  }

  const validation = validateJsonWithErrors(text);
  if (validation.valid) {
    showStatus('✓ JSON is valid', 'success');
  } else {
    const errorCount = validation.errors.length;
    showStatus(`✗ Found ${errorCount} error${errorCount > 1 ? 's' : ''} in JSON`, 'error');
  }
});

// Button event listeners
themeBtn.addEventListener('click', toggleTheme);
copyBtn.addEventListener('click', copyFormattedJson);
downloadBtn.addEventListener('click', downloadJson);
expandAllBtn.addEventListener('click', expandAll);
collapseAllBtn.addEventListener('click', collapseAll);
clearBtn.addEventListener('click', clearEditor);

editModeBtn.addEventListener('click', () => switchMode('edit'));
viewModeBtn.addEventListener('click', () => switchMode('view'));

// Option toggles
showLineNumbersCheckbox.addEventListener('change', toggleLineNumbers);
autoFormatCheckbox.addEventListener('change', toggleAutoFormat);
smartFoldingCheckbox.addEventListener('change', toggleSmartFolding);

// Real-time updates
jsonEditor.addEventListener('input', updateEditorHighlight);
jsonEditor.addEventListener('scroll', syncScroll);

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'n':
        e.preventDefault();
        newBtn.click();
        break;
      case 'o':
        e.preventDefault();
        openBtn.click();
        break;
      case 's':
        e.preventDefault();
        saveBtn.click();
        break;
      case 'f':
        if (!e.shiftKey) {
          e.preventDefault();
          formatBtn.click();
        }
        break;
      case 'v':
        if (e.shiftKey) {
          e.preventDefault();
          switchMode(isViewMode ? 'edit' : 'view');
        }
        break;
      case 'd':
        if (e.shiftKey) {
          e.preventDefault();
          toggleTheme();
        }
        break;
      case 'l':
        e.preventDefault();
        showLineNumbersCheckbox.click();
        break;
    }
  }
  
  // Escape key to exit view mode
  if (e.key === 'Escape' && isViewMode) {
    switchMode('edit');
  }
});

// Mobile touch support
let touchStartY = 0;
jsonEditor.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
});

jsonEditor.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const deltaY = touchStartY - touchY;
  
  // Smooth scrolling on mobile
  jsonEditor.scrollTop += deltaY * 0.5;
  syncScroll();
  
  touchStartY = touchY;
});

// Global functions for HTML onclick
window.toggleExpand = toggleExpand;

// Initialize with dark theme and syntax highlighting enabled by default
document.body.classList.remove('light-theme');
themeBtn.textContent = 'Light Theme';
updateFileInfo();
updateEditorHighlight();

// Load demo data on first run
if (!jsonEditor.value.trim()) {
  jsonEditor.value = `{
  "name": "ManyJson Demo",
  "version": "2.0.0",
  "features": [
    "Real-time syntax highlighting",
    "Intelligent error detection",
    "Smart folding",
    "Mobile responsive design"
  ],
  "settings": {
    "theme": "dark",
    "autoFormat": true,
    "lineNumbers": true
  },
  "status": "ready"
}`;
  updateEditorHighlight();
  showStatus('Welcome to ManyJson! Demo data loaded.', 'info', 4000);
}