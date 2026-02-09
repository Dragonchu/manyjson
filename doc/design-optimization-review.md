# ManyJson Design Optimization Review

> 基于对完整代码库的分析，从交互设计、UI 设计和系统架构三个维度，识别出的优化方向。

---

## 一、交互设计 (Interaction Design)

### 1.1 键盘快捷键体系不完整

**现状**: 仅实现了主题切换 (`Cmd/Ctrl+Shift+T`)、编辑器内的 Enter/Escape 和 CodeMirror 内置的 Tab 缩进。

**问题**:
- 缺少核心快捷键: `Cmd/Ctrl+S` 保存、`Cmd/Ctrl+Z/Y` 撤销/重做、`Cmd/Ctrl+N` 新建 Schema、`F2` 重命名
- 快捷键注册分散在各组件中（`useUIStore`、`MiddlePanel`），没有统一的快捷键管理器
- 无法让用户自定义快捷键

**建议**: 创建 `useKeyboardShortcuts()` composable，集中注册、冲突检测、支持用户自定义绑定。

### 1.2 缺少拖放交互

**现状**: 完全没有 drag-and-drop 实现。面板调整大小通过手动 mouse event 实现 (`Home.vue:65-87`)。

**问题**:
- Schema/文件列表无法拖拽排序
- 不支持拖拽文件到应用窗口导入 JSON 文件
- 不支持拖拽文件到 Schema 建立关联
- 面板调整没有吸附/网格辅助

**建议**: 优先实现文件拖拽导入（桌面端高频操作），其次实现列表拖拽排序。面板调整增加常用宽度吸附点（如 300px、400px）。

### 1.3 无撤销/重做系统

**现状**: 所有编辑操作即时生效，无法回退。

**问题**:
- JSON 内容编辑、Schema 修改均不可撤销
- 批量操作（复制文件 + 关联 Schema）非原子性
- Web 模式下编辑中途刷新页面会丢失未保存内容

**建议**: 基于 Command 模式实现历史栈，关键操作（删除 Schema、删除文件）加入 undo 缓冲。Web 模式下实现 localStorage 自动草稿保存。

### 1.4 错误反馈不充分

**现状**: 状态栏消息 3 秒后消失 (`useUIStore.ts:87-92`)，校验错误在右侧面板展示路径信息。

**问题**:
- 状态消息为一次性弹出，多个错误只显示最后一条
- 无持久化错误日志面板
- 校验错误路径未与编辑器联动（无法点击跳转到错误行）
- 错误信息偏技术化，缺少修复建议
- 部分后台操作失败只记录 console，用户无感知

**建议**: 增加可折叠的错误历史面板；校验错误支持点击跳转到编辑器对应位置；错误消息增加上下文和修复提示。

### 1.5 无障碍访问 (Accessibility) 薄弱

**现状**: 有语义化颜色和最小触摸目标 (44px)，支持 `prefers-color-scheme`。

**问题**:
- 按钮缺少 `aria-label`，上下文菜单缺少 `role="menu"`
- 列表项无法通过方向键导航
- 不尊重 `prefers-reduced-motion` 媒体查询
- 不支持 `prefers-contrast` 高对比度模式
- 文件有效性状态仅依赖颜色区分（红/绿），未配合图标
- 使用 emoji（📄、📁）作为图标，缺少替代文本

**建议**: 补充完整的 ARIA 标注；实现方向键菜单导航；增加 `prefers-reduced-motion` 和 `prefers-contrast` 适配；错误/成功状态增加图标区分。

---

## 二、UI 设计 (UI Design)

### 2.1 响应式布局断点单一

**现状**: 仅有一个 767px 断点 (`useUIStore.ts:185`)，低于此值切换至 `MobileFriendly.vue` 简化视图。

**问题**:
- 平板设备 (768px-1024px) 体验不佳，三面板过于拥挤
- 移动端为完全独立的简化视图，功能大幅缩减
- iPad 分屏模式未考虑
- 无响应式字体大小

**建议**: 实现三级断点体系：
- `< 600px`: 单面板堆叠，底部 Tab 导航
- `600px - 1024px`: 双面板 + 可切换第三面板
- `> 1024px`: 完整三面板布局

增加响应式排版 (`clamp()` 函数适配字体大小)。

### 2.2 动画与过渡缺失

**现状**: 定义了 Apple 缓动曲线和 0.3s/0.15s 过渡时间 (`style.css:95-98`)，但实际使用有限。

**问题**:
- 切换 Schema/文件无过渡动画，视觉上缺乏连续性
- 文件操作（复制、重命名、保存）无加载指示器
- 列表项（Schema 列表、文件列表）同时渲染，无交错动画
- 主题切换可能出现 FOUC (Flash of Unstyled Content)
- 列表项缺少 hover 微交互反馈

**建议**: 为面板内容切换增加 fade/slide 过渡；异步操作增加 skeleton/spinner 加载态；列表渲染增加交错入场动画；全局尊重 `prefers-reduced-motion`。

### 2.3 组件一致性问题

**现状**: 有统一的 `.apple-btn`、`.apple-list-item` 基础样式和设计 token 体系。

**问题**:
- 对话框/弹窗样式不统一：`AddSchemaDialog.vue`、`ShareSchemaPopup.vue`、`FileSelectorPopup.vue` 各自实现
- 图标体系混乱：emoji（📄、📁、⚠️）与 SVG icon 组件（`icons/` 目录）混用
- 表单输入样式分散：内联重命名输入框与对话框输入框样式不一致
- 部分组件直接使用硬编码 px 值，未使用 `--space-*` token

**建议**: 抽象统一的 Modal、Input、Card、List 基础组件；统一使用 SVG icon 组件替代 emoji；强制执行 design token。

### 2.4 Design Token 体系不完整

**现状**: `style.css` 中定义了 164+ 个 token，涵盖颜色、间距、排版。

**问题**:
- 存在 `--linear-*` 遗留兼容层变量，造成重复
- 缺少动效 token（如 `--duration-fast`、`--duration-slow`、`--easing-*`）
- 缺少 z-index token，各处硬编码 `z-index: 10`、`z-index: 1000`
- 缺少无障碍相关 token（高对比度、减弱动效的变体值）
- 排版 scale 不响应视口变化

**建议**: 补充 motion token、z-index 层级 token、accessibility token；移除遗留兼容层；通过 CSS lint 规则强制 token 使用。

---

## 三、系统架构 (System Architecture)

### 3.1 Store 职责过重，需要拆分

**现状**: `app` store 超过 650 行，混合了 Schema CRUD、文件管理、持久化、校验等逻辑。

**问题**:
- 单一 store 承载过多职责，难以维护和测试
- 文件引用存在双重追踪：`jsonFiles[]` 数组和 `schema.associatedFiles[]` 数组可能不同步
- 持久化逻辑（Electron config / localStorage）直接嵌入 store action 中
- 缺少 computed 派生状态（如 `filesBySchema`、`invalidFiles`）
- 无批量操作事务支持，并发写入可能导致状态损坏

**建议**:
1. 拆分为 `SchemaStore`、`FileStore`、`ValidationStore`
2. 持久化逻辑提取为独立的 `PersistenceService`
3. 消除文件引用双重追踪，建立单一数据源
4. 增加 computed 派生状态减少重复计算
5. 实现乐观更新 + 失败回滚模式

### 3.2 性能优化空间

**现状**: 编辑器有 validator 缓存，Schema 变化时才重编译。但缺少系统性的性能优化。

**问题**:
- 列表无虚拟滚动：Schema/文件列表全量渲染，100+ 项时性能下降
- AJV 实例未复用：`AdvancedJsonEditor.vue:46` 和 `ValidationService.ts:13` 各自创建实例
- 大文件全量加载到内存，无分页/流式处理
- JSON Diff 计算复杂度较高，大文件时可能卡顿
- 组件无懒加载：所有组件打包在一个 bundle 中
- `useUIStore.ts:158` 注册的 media query listener 无清理逻辑，可能泄漏

**建议**:
1. 列表组件引入虚拟滚动（`vue-virtual-scroller` 或自实现）
2. AJV 改为单例复用
3. 大文件编辑实现分块加载或只读预览模式
4. 路由级组件使用 `defineAsyncComponent` 懒加载
5. Diff 算法使用 Myers' diff 或 Patience diff

### 3.3 平台抽象层有漏洞

**现状**: `platform/index.ts` 定义了清晰的接口，`web.ts` 和 `desktop.ts` 分别实现。

**问题**:
- Web 实现不完整：`copyFile`、`deleteFile`、`getFileStats` 返回 `{ success: true }` 占位
- 文件 handle 存储在内存 `Map` 中 (`web.ts:11`)，关闭文件后 handle 不回收，存在内存泄漏
- 虚拟路径方案（`fs://`、`structured://`、`mock://`）暴露给了组件层
- Electron IPC 调用无超时和重试机制
- `electronAPI` 被强制转为 `any` 类型 (`desktop.ts:8`)，丧失类型安全

**建议**:
1. 完善 Web 实现：使用 IndexedDB 存储文件，localStorage 存储 Schema
2. 文件 handle 使用 WeakRef 或超时清理机制
3. 路径方案对组件层透明化，由 platform 层内部处理
4. IPC 调用增加超时 + 指数退避重试
5. 导出 preload 类型定义，确保 main/renderer 类型安全

### 3.4 错误处理不够健壮

**现状**: 异步函数有 try-catch，错误记录到 console，部分通过 `showStatus` 展示。

**问题**:
- 大量 catch 块只 `console.error`，不向上传播也不通知用户
- 无 Vue ErrorBoundary 组件，单个组件错误会崩溃整个子树
- 错误信息为通用文案（如 "Failed to rename file"），缺少上下文
- 深层嵌套调用未保留原始错误堆栈
- 删除操作中途失败，无状态回滚机制

**建议**:
1. 定义领域错误类型：`ValidationError`、`StorageError`、`PlatformError`
2. 实现 Vue ErrorBoundary 组件，优雅降级而非白屏
3. 错误携带上下文信息：`new StorageError('Save failed', { file, cause })`
4. 关键操作实现悲观更新 + 失败回滚

### 3.5 测试覆盖率不足

**现状**: `test/app.test.ts` 约 100 行，测试了 store 初始化和基础模式切换。

**问题**:
- 仅有 store 基础测试，覆盖率远低于 store 的 650+ 行逻辑
- 无 Vue 组件测试（渲染、事件、交互）
- 无 Service 层测试（ValidationService、FileService）
- 无集成测试（平台抽象的 web/desktop 对比）
- 无 E2E 测试（完整的导入 → 校验 → 编辑 → 保存流程）
- 边界场景未覆盖（大文件、并发操作、错误场景）

**建议**:
1. 使用 `@vue/test-utils` 增加组件行为测试
2. Service 层独立测试，覆盖正常和异常路径
3. 引入 Playwright 进行 E2E 流程测试
4. 设定覆盖率目标（建议 80%+）
5. 增加大文件和并发场景的性能基准测试

---

## 四、优先级建议

### P0 - 高影响、低成本
| 优化项 | 涉及范围 |
|--------|----------|
| 集中式键盘快捷键系统 | 新建 composable |
| ARIA 标注 + 键盘导航 | 各组件修改 |
| AJV 单例复用 | validationService + AdvancedJsonEditor |
| 持久化错误日志面板 | 新建组件 + ui store |

### P1 - 高影响、中等成本
| 优化项 | 涉及范围 |
|--------|----------|
| Store 拆分（Schema/File/Validation） | stores 重构 |
| 虚拟滚动 | AppSidebar + MiddlePanel |
| 统一 Modal/Input/Card 组件 | 组件库重构 |
| ErrorBoundary + 领域错误类型 | 全局 + services |
| 补充 motion/z-index design token | style.css |

### P2 - 高影响、高成本
| 优化项 | 涉及范围 |
|--------|----------|
| 拖放交互（导入 + 排序 + 关联） | Home + 各面板 |
| 撤销/重做历史系统 | stores + 新 service |
| 多断点响应式布局 | Home + 各面板 + style.css |
| 完善 Web 平台实现 | platform/web.ts + IndexedDB |
| 全面测试套件（单元 + 集成 + E2E） | test/ 目录 |

### P3 - 长期演进
| 优化项 | 涉及范围 |
|--------|----------|
| 组件懒加载 + 代码分割 | vite config + router |
| 平台特定 UX（iOS/Android） | 新建 platform UI 层 |
| 实时协作 | 新增 WebSocket 服务层 |
