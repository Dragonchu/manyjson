/*
  渲染进程脚本：JSON 文件编辑器功能实现
  支持语法高亮、展开折叠、错误提示等高级功能
*/

let currentFilePath = null;
let isDarkTheme = false;
let isViewMode = false;

// 显示应用信息
const appInfoEl = document.getElementById('appInfo');
if (window.appInfo && appInfoEl) {
  appInfoEl.textContent = `${window.appInfo.name} v${window.appInfo.version}`;
}

// 获取 DOM 元素
const jsonEditor = document.getElementById('jsonEditor');
const jsonViewer = document.getElementById('jsonViewer');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');
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
const editModeBtn = document.getElementById('editModeBtn');
const viewModeBtn = document.getElementById('viewModeBtn');

// 显示状态信息
function showStatus(message, type = 'success') {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  // 3秒后自动隐藏
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// 更新文件信息显示
function updateFileInfo(filePath = null) {
  currentFilePath = filePath;
  if (filePath) {
    fileInfo.textContent = `当前文件: ${filePath}`;
  } else {
    fileInfo.textContent = '未保存的新文件';
  }
}

// JSON 语法高亮
function highlightJson(jsonString, indent = 0) {
  try {
    const obj = JSON.parse(jsonString);
    return formatJsonWithHighlight(obj, indent);
  } catch (error) {
    return `<div class="json-error">JSON 格式错误: ${error.message}</div>`;
  }
}

// 格式化 JSON 并添加语法高亮
function formatJsonWithHighlight(obj, indent = 0, path = '') {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);
  
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
    let result = `<div class="json-line json-expandable" data-path="${path}">`;
    result += `<span class="json-expand-icon" onclick="toggleExpand('${arrayId}')">▼</span>`;
    result += `<span class="json-brace">[</span>`;
    result += `</div>`;
    
    result += `<div id="${arrayId}" class="json-content">`;
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
    let result = `<div class="json-line json-expandable" data-path="${path}">`;
    result += `<span class="json-expand-icon" onclick="toggleExpand('${objectId}')">▼</span>`;
    result += `<span class="json-brace">{</span>`;
    result += `</div>`;
    
    result += `<div id="${objectId}" class="json-content">`;
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

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 切换展开/折叠
function toggleExpand(elementId) {
  const element = document.getElementById(elementId);
  const expandIcon = element.parentElement.querySelector('.json-expand-icon');
  
  if (element.style.display === 'none') {
    element.style.display = 'block';
    expandIcon.textContent = '▼';
  } else {
    element.style.display = 'none';
    expandIcon.textContent = '▶';
  }
}

// 展开所有节点
function expandAll() {
  const contents = jsonViewer.querySelectorAll('.json-content');
  const icons = jsonViewer.querySelectorAll('.json-expand-icon');
  
  contents.forEach(content => {
    content.style.display = 'block';
  });
  
  icons.forEach(icon => {
    icon.textContent = '▼';
  });
}

// 折叠所有节点
function collapseAll() {
  const contents = jsonViewer.querySelectorAll('.json-content');
  const icons = jsonViewer.querySelectorAll('.json-expand-icon');
  
  contents.forEach(content => {
    content.style.display = 'none';
  });
  
  icons.forEach(icon => {
    icon.textContent = '▶';
  });
}

// 更新 JSON 视图
function updateJsonViewer() {
  const text = jsonEditor.value.trim();
  if (!text) {
    jsonViewer.innerHTML = '<div class="muted">没有内容可显示</div>';
    return;
  }
  
  try {
    JSON.parse(text); // 验证 JSON 格式
    jsonViewer.innerHTML = highlightJson(text);
  } catch (error) {
    jsonViewer.innerHTML = `<div class="json-error">JSON 格式错误: ${error.message}</div>`;
  }
}

// 切换编辑/预览模式
function switchMode(mode) {
  isViewMode = mode === 'view';
  
  if (isViewMode) {
    jsonEditor.style.display = 'none';
    jsonViewer.style.display = 'block';
    editModeBtn.classList.remove('active');
    viewModeBtn.classList.add('active');
    updateJsonViewer();
  } else {
    jsonEditor.style.display = 'block';
    jsonViewer.style.display = 'none';
    editModeBtn.classList.add('active');
    viewModeBtn.classList.remove('active');
  }
}

// 切换主题
function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  
  if (isDarkTheme) {
    document.body.style.background = '#1e1e1e';
    document.body.style.color = '#d4d4d4';
    jsonViewer.classList.add('dark-theme');
    jsonEditor.style.background = '#1e1e1e';
    jsonEditor.style.color = '#d4d4d4';
    jsonEditor.style.borderColor = '#333';
    themeBtn.textContent = '浅色主题';
  } else {
    document.body.style.background = '#f5f5f7';
    document.body.style.color = '#1f1f1f';
    jsonViewer.classList.remove('dark-theme');
    jsonEditor.style.background = '#fafafa';
    jsonEditor.style.color = '#1f1f1f';
    jsonEditor.style.borderColor = '#ddd';
    themeBtn.textContent = '深色主题';
  }
  
  // 如果在预览模式，更新视图
  if (isViewMode) {
    updateJsonViewer();
  }
}

// 复制格式化的 JSON
async function copyFormattedJson() {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('没有内容可复制', 'error');
      return;
    }
    
    const jsonData = JSON.parse(text);
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    await navigator.clipboard.writeText(formattedJson);
    showStatus('格式化的 JSON 已复制到剪贴板');
  } catch (error) {
    showStatus(`复制失败: ${error.message}`, 'error');
  }
}

// 下载 JSON 文件
function downloadJson() {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('没有内容可下载', 'error');
      return;
    }
    
    const jsonData = JSON.parse(text);
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilePath ? currentFilePath.split('/').pop() : 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showStatus('JSON 文件已下载');
  } catch (error) {
    showStatus(`下载失败: ${error.message}`, 'error');
  }
}

// 事件监听器
newBtn.addEventListener('click', () => {
  jsonEditor.value = '';
  updateFileInfo(null);
  if (isViewMode) {
    updateJsonViewer();
  }
  showStatus('已创建新文件');
});

openBtn.addEventListener('click', async () => {
  try {
    const result = await window.jsonAPI.readFile();
    if (result.success) {
      jsonEditor.value = JSON.stringify(result.data, null, 2);
      updateFileInfo(result.filePath);
      if (isViewMode) {
        updateJsonViewer();
      }
      showStatus(`成功打开文件: ${result.filePath}`);
    } else {
      showStatus(`打开文件失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`打开文件出错: ${error.message}`, 'error');
  }
});

saveBtn.addEventListener('click', async () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('请输入 JSON 内容', 'error');
      return;
    }

    // 验证 JSON 格式
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      showStatus(`JSON 格式错误: ${parseError.message}`, 'error');
      return;
    }

    const result = await window.jsonAPI.writeFile({
      filePath: currentFilePath,
      jsonData: jsonData
    });

    if (result.success) {
      updateFileInfo(result.filePath);
      showStatus(`成功保存文件: ${result.filePath}`);
    } else {
      showStatus(`保存文件失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`保存文件出错: ${error.message}`, 'error');
  }
});

formatBtn.addEventListener('click', () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('请输入 JSON 内容', 'error');
      return;
    }

    const jsonData = JSON.parse(text);
    jsonEditor.value = JSON.stringify(jsonData, null, 2);
    if (isViewMode) {
      updateJsonViewer();
    }
    showStatus('JSON 格式化完成');
  } catch (error) {
    showStatus(`格式化失败: ${error.message}`, 'error');
  }
});

validateBtn.addEventListener('click', () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('请输入 JSON 内容', 'error');
      return;
    }

    JSON.parse(text);
    showStatus('JSON 格式验证通过 ✓');
  } catch (error) {
    showStatus(`JSON 格式错误: ${error.message}`, 'error');
  }
});

// 新功能事件监听器
themeBtn.addEventListener('click', toggleTheme);
copyBtn.addEventListener('click', copyFormattedJson);
downloadBtn.addEventListener('click', downloadJson);
expandAllBtn.addEventListener('click', expandAll);
collapseAllBtn.addEventListener('click', collapseAll);

editModeBtn.addEventListener('click', () => switchMode('edit'));
viewModeBtn.addEventListener('click', () => switchMode('view'));

// 实时更新预览（当在预览模式时）
jsonEditor.addEventListener('input', () => {
  if (isViewMode) {
    updateJsonViewer();
  }
});

// 键盘快捷键支持
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
        e.preventDefault();
        formatBtn.click();
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
    }
  }
});

// 全局函数，供 HTML onclick 使用
window.toggleExpand = toggleExpand;

// 初始化时设置默认主题
themeBtn.textContent = '深色主题';