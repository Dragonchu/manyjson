#!/bin/bash

# ManyJson 构建脚本

set -e

BUILD_DIR="${1:-build}"

if [[ ! -d "$BUILD_DIR" ]]; then
    echo "❌ 构建目录不存在，请先运行 ./configure"
    exit 1
fi

echo "🏗️ 构建项目..."
cd "$BUILD_DIR"
make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo "✅ 构建完成！"
echo "📋 可执行文件位置: $BUILD_DIR/bin/manyjson"
echo "📋 测试文件位置: $BUILD_DIR/bin/run_tests" 