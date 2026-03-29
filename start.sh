#!/bin/bash

# 财富自由之路 - 快速启动脚本
# 用于一键启动开发服务器

set -e

echo "🚀 财富自由之路 - 启动中..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    pnpm install
    echo ""
fi

# 检查 shared 包是否已构建
if [ ! -d "packages/shared/dist" ]; then
    echo "🔨 构建共享包..."
    cd packages/shared
    pnpm build
    cd ../..
    echo ""
fi

# 检查 desktop 的 node_modules 是否存在
if [ ! -d "apps/desktop/node_modules" ]; then
    echo "📦 安装桌面应用依赖..."
    cd apps/desktop
    pnpm install
    cd ../..
    echo ""
fi

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo ""
cd apps/desktop
pnpm dev
