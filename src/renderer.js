/*
  渲染进程脚本：JSON 文件编辑器功能实现
*/

let currentFilePath = null;

// 显示应用信息
const appInfoEl = document.getElementById('appInfo');
if (window.appInfo && appInfoEl) {
  appInfoEl.textContent = `${window.appInfo.name} v${window.appInfo.version}`;
}

// 获取 DOM 元素
const jsonEditor = document.getElementById('jsonEditor');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');
const newBtn = document.getElementById('newBtn');
const openBtn = document.getElementById('openBtn');
const saveBtn = document.getElementById('saveBtn');
const formatBtn = document.getElementById('formatBtn');
const validateBtn = document.getElementById('validateBtn');

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

// 新建文件
newBtn.addEventListener('click', () => {
  jsonEditor.value = '';
  updateFileInfo(null);
  showStatus('已创建新文件');
});

// 打开文件
openBtn.addEventListener('click', async () => {
  try {
    const result = await window.jsonAPI.readFile();
    if (result.success) {
      jsonEditor.value = JSON.stringify(result.data, null, 2);
      updateFileInfo(result.filePath);
      showStatus(`成功打开文件: ${result.filePath}`);
    } else {
      showStatus(`打开文件失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`打开文件出错: ${error.message}`, 'error');
  }
});

// 保存文件
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

// 格式化 JSON
formatBtn.addEventListener('click', () => {
  try {
    const text = jsonEditor.value.trim();
    if (!text) {
      showStatus('请输入 JSON 内容', 'error');
      return;
    }

    const jsonData = JSON.parse(text);
    jsonEditor.value = JSON.stringify(jsonData, null, 2);
    showStatus('JSON 格式化完成');
  } catch (error) {
    showStatus(`格式化失败: ${error.message}`, 'error');
  }
});

// 验证 JSON
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
    }
  }
});