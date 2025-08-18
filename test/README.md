# Test Architecture Documentation

## 测试架构概述

这个项目采用分层测试架构，与重构后的应用架构保持一致：

```
test/
├── setup.ts              # 全局测试设置
├── index.test.ts          # 测试健康检查
├── stores/                # Store 层测试（状态管理）
│   └── app.test.ts       # 简化后的 store 测试
├── services/              # Service 层测试（业务逻辑）
│   ├── fileService.test.ts
│   ├── validationService.test.ts
│   └── schemaService.test.ts
└── composables/           # Composable 层测试（集成测试）
    ├── useSchemas.test.ts
    ├── useJsonFiles.test.ts
    └── useValidation.test.ts
```

## 测试类型和策略

### 1. 单元测试 (Unit Tests)
- **位置**: `test/services/`
- **目标**: 测试独立的业务逻辑
- **特点**: 
  - 完全隔离，使用 mock
  - 快速执行
  - 高覆盖率要求

### 2. 集成测试 (Integration Tests)  
- **位置**: `test/composables/`
- **目标**: 测试 composables 如何协调 store 和 services
- **特点**:
  - 测试组件间交互
  - Mock 外部依赖
  - 验证数据流

### 3. 状态测试 (State Tests)
- **位置**: `test/stores/`  
- **目标**: 测试纯状态管理逻辑
- **特点**:
  - 简单的状态变更测试
  - 计算属性验证
  - UI 状态管理

## 运行测试

### 全部测试
```bash
npm test                    # 交互模式
npm run test:run           # 单次运行
npm run test:coverage      # 带覆盖率报告
```

### 分类测试
```bash
npm run test:services      # 仅服务层测试
npm run test:composables   # 仅组合函数测试  
npm run test:stores        # 仅 store 测试
```

### 开发模式
```bash
npm run test:watch         # 监听模式
npm run test:ui           # UI 界面
```

## 覆盖率要求

- **全局覆盖率**: 80%
- **分支覆盖率**: 80%
- **函数覆盖率**: 80%
- **语句覆盖率**: 80%

## Mock 策略

### 全局 Mock
- `window.electronAPI` - 在 `setup.ts` 中全局 mock
- `console` 方法 - 减少测试输出噪音

### 服务 Mock
- 服务层测试中 mock 外部依赖
- Composable 测试中 mock 服务层
- 使用 `vi.mock()` 进行模块级 mock

## 测试数据

测试数据文件保留用于特定测试场景：
- `test-data.json` - 有效的测试数据
- `invalid-test.json` - 无效数据测试

## CI/CD 集成

GitHub Actions 工作流包含：
1. 分层测试执行
2. 覆盖率报告生成
3. 覆盖率上传到 Codecov
4. 测试结果工件保存

## 最佳实践

### 测试命名
- 使用描述性的测试名称
- 遵循 "should do something when condition" 模式
- 分组相关测试用例

### 测试结构
- **Arrange**: 准备测试数据和 mock
- **Act**: 执行被测试的功能
- **Assert**: 验证结果

### Mock 管理
- 在 `beforeEach` 中清理 mock
- 使用有意义的 mock 返回值
- 验证 mock 调用参数

### 异步测试
- 正确处理 Promise 和 async/await
- 测试成功和失败场景
- 验证错误处理逻辑

## 故障排除

### 常见问题
1. **Mock 未生效**: 检查 mock 路径和模块导入
2. **异步测试失败**: 确保正确等待 Promise
3. **覆盖率不足**: 添加边界情况和错误处理测试

### 调试技巧
- 使用 `test.only()` 运行单个测试
- 使用 `console.log` 调试（在测试完成后移除）
- 检查 mock 调用历史：`expect(mockFn).toHaveBeenCalledWith(...)`