#!/bin/bash

# Google Test 设置脚本
# 用于下载和安装 Google Test 框架

set -e  # 遇到错误时退出

GTEST_VERSION="1.12.1"
GTEST_DIR="third_party/googletest"
BUILD_DIR="build"

echo "🚀 开始设置 Google Test 框架..."

# 检查是否已经存在
if [ -d "$GTEST_DIR" ]; then
    echo "✅ Google Test 已存在，跳过下载"
else
    echo "📥 下载 Google Test v$GTEST_VERSION..."
    
    # 创建目录
    mkdir -p third_party
    
    # 下载 Google Test
    git clone --depth 1 --branch release-$GTEST_VERSION \
        https://github.com/google/googletest.git $GTEST_DIR
    
    echo "✅ Google Test 下载完成"
fi

# 创建构建目录
mkdir -p $BUILD_DIR

echo "🔧 配置 CMake..."
cd $BUILD_DIR
cmake .. -DCMAKE_BUILD_TYPE=Debug

echo "🏗️ 构建项目..."
make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo "✅ 设置完成！"
echo ""
echo "📋 使用方法："
echo "  构建项目: ./scripts/build.sh"
echo "  运行测试: ./scripts/test.sh"
echo "  运行程序: ./scripts/run.sh"
echo "  清理构建: ./scripts/clean.sh" 