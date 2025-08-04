# ManyJson

Keep your JSON files together and show their relationships.

## 快速开始

### 1. 配置项目
```bash
./configure
```

### 2. 构建项目
```bash
./scripts/build.sh
```

### 3. 运行程序
```bash
./scripts/run.sh
```

### 4. 运行测试
```bash
./scripts/test.sh
```

## 配置选项

```bash
# 查看所有选项
./configure --help

# Release 构建
./configure -r

# 自定义构建目录
./configure -b build_release

# 使用系统安装的 Google Test
./configure -g

# 禁用测试
./configure -t
```

## VSCode 调试

项目包含完整的 VSCode 配置：

1. **调试主程序**: 按 F5 选择 "Debug Main"
2. **调试测试**: 按 F5 选择 "Debug Tests"
3. **构建任务**: Ctrl+Shift+P → "Tasks: Run Task" → "build"

## 项目结构

```
manyjson/
├── src/           # 源代码文件 (.cpp)
├── include/       # 头文件 (.h, .hpp)
├── tests/         # 测试文件
├── scripts/       # 构建脚本
├── docs/          # 文档
├── examples/      # 示例代码
├── .vscode/       # VSCode 配置
├── configure      # 配置脚本
└── CMakeLists.txt # CMake 配置
```

## 开发工作流

1. **添加新源文件**: 放在 `src/` 目录
2. **添加新头文件**: 放在 `include/` 目录  
3. **添加新测试**: 放在 `tests/` 目录
4. **重新构建**: `./scripts/build.sh`
5. **运行测试**: `./scripts/test.sh`

## 依赖

- CMake 3.16+
- C++17 编译器 (g++ 或 clang++)
- Git (用于下载 Google Test)
- Google Test (自动下载或系统安装)

