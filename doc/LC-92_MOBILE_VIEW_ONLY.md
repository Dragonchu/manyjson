# LC-92 优化手机端/小屏幕展示效果（仅展示模式）

## 目标
- 在移动端（宽度 ≤ 767px）与小屏幕上仅支持“查看”，不支持“编辑/新建/比较”等操作。
- 用户可以：
  - 从左侧选择一个 Schema；
  - 在中间面板点选该 Schema 下的 JSON 文件；
  - 在右侧查看 Schema 定义或 JSON 文件内容；
  - 可拷贝内容到剪贴板。

## 范围与约束
- 所有文档读取/撰写均基于 `/doc` 目录。
- 移动端仅展示，不提供：
  - 新建 Schema / 导入 Schema / 新建 JSON 文件；
  - JSON 编辑、Schema 编辑；
  - Diff 比较视图；
  - 右键上下文菜单；
  - 面板拖拽分隔条。

## 设计
1. 新增响应式状态
   - 在 `src/stores/ui.ts` 中新增 `isMobile`，并提供 `initializeResponsive()`。
   - 依据窗口宽度（≤ 767px）设置 `isMobile`。

2. 组件层行为调整（当 `ui.isMobile === true`）
   - `views/Home.vue`
     - 隐藏左右分隔拖拽手柄；
     - 隐藏 `ContextMenu`、`AddFilePopup`、`FileSelectorPopup`。
   - `components/AppSidebar.vue`
     - 隐藏“Add”“Import”；保留“Refresh”；
     - 阻断右键菜单触发。
     - 移动端下侧栏占满宽度（配合全局 CSS column 布局）。
   - `components/MiddlePanel.vue`
     - 隐藏“Add JSON file”按钮；
     - 禁用重命名（双击/F2）与右键菜单；
     - 仍可点击选择文件查看。
   - `components/RightPanel.vue`
     - 隐藏编辑按钮与编辑器、Schema 编辑器；
     - 隐藏 Diff 视图；
     - 保留“复制到剪贴板”按钮；
     - 按状态显示“Schema 定义”或“JSON 内容”查看器。

3. 布局与样式
   - `src/style.css` 已有 `<768px` 下将 `.app-container` 切至纵向堆叠的规则；
   - 补充移动端 `body` 允许滚动；
   - 侧栏移动端宽度 100%，中间面板 100%，右侧面板自适应高度。

## 关键改动（文件）
- `src/stores/ui.ts`
  - 新增：`isMobile: Ref<boolean>` 与 `initializeResponsive()`；
  - 导出 `isMobile` 与初始化函数。
- `src/App.vue`
  - `onMounted` 时调用 `ui.initializeResponsive()`。
- `src/views/Home.vue`
  - 基于 `ui.isMobile` 隐藏拖拽手柄、`ContextMenu`、弹窗组件。
- `src/components/AppSidebar.vue`
  - 基于 `ui.isMobile` 隐藏新增/导入按钮；阻断右键；移动端宽度样式。
- `src/components/MiddlePanel.vue`
  - 基于 `ui.isMobile` 隐藏“Add”按钮；禁用右键与重命名。
- `src/components/RightPanel.vue`
  - 基于 `ui.isMobile` 隐藏编辑器、编辑按钮与 Diff 组件；保留复制。
- `src/style.css`
  - 移动端下 `body` 允许滚动；其余移动栈式布局规则沿用既有实现。

## 行为验证（手动）
1. 窗口宽度 < 768px：
   - 仅显示三段式纵向堆叠：侧栏（Schema 列表）→ 中间列表（文件）→ 右侧（查看器）。
   - 看不到编辑、新增、导入、Diff、右键菜单与拖拽手柄。
   - 点击 Schema → 展示其关联文件；点击文件 → 右侧显示 JSON 内容；右上可复制。
2. 窗口宽度 ≥ 768px：
   - 保持桌面端完整功能。

## 兼容性
- 不改变路由与存储结构；
- 桌面端/宽屏行为不变；
- Web 模式下“保存到内存”的既有逻辑保持不变，仅在移动端被隐藏 UI 入口。

## 相关文件列表
- `src/stores/ui.ts`
- `src/App.vue`
- `src/views/Home.vue`
- `src/components/AppSidebar.vue`
- `src/components/MiddlePanel.vue`
- `src/components/RightPanel.vue`
- `src/style.css`

## 备注
- 本次未新增构建产物与依赖；`.gitignore` 现有配置已覆盖常见目录与缓存。
