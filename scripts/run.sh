#!/bin/bash

# ManyJson 运行脚本

set -e

BUILD_DIR="${1:-build}"

if [[ ! -d "$BUILD_DIR" ]]; then
    echo "❌ 构建目录不存在，请先运行 ./configure"
    exit 1
fi

if [[ ! -f "$BUILD_DIR/bin/manyjson" ]]; then
    echo "❌ 可执行文件不存在，请先运行 ./scripts/build.sh"
    exit 1
fi

echo "🚀 运行 ManyJson..."
"$BUILD_DIR/bin/manyjson" 