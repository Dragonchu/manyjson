/*
  渲染进程脚本：仅使用浏览器 API，与主进程交互通过 preload 暴露的接口
*/

const appInfoEl = document.getElementById('appInfo');
if (window.appInfo && appInfoEl) {
  appInfoEl.textContent = `${window.appInfo.name} v${window.appInfo.version}`;
}

const helloBtn = document.getElementById('helloBtn');
if (helloBtn) {
  helloBtn.addEventListener('click', () => {
    // 在此触发与主进程通信或业务逻辑
    alert('Hello from Electron renderer!');
  });
}