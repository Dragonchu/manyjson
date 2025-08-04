#!/bin/bash

# ManyJson 清理脚本

set -e

BUILD_DIR="${1:-build}"

echo "🧹 清理构建目录: $BUILD_DIR"

if [[ -d "$BUILD_DIR" ]]; then
    rm -rf "$BUILD_DIR"
    echo "✅ 清理完成"
else
    echo "ℹ️ 构建目录不存在，无需清理"
fi 