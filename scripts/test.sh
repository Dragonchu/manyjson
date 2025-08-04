#!/bin/bash

# ManyJson 测试脚本

set -e

BUILD_DIR="${1:-build}"

if [[ ! -d "$BUILD_DIR" ]]; then
    echo "❌ 构建目录不存在，请先运行 ./configure"
    exit 1
fi

echo "🧪 运行测试..."
cd "$BUILD_DIR"

# 运行CMake测试
if make test; then
    echo "✅ 所有测试通过！"
else
    echo "❌ 测试失败"
    exit 1
fi 