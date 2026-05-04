#!/bin/bash
# v2.0.0 一键发布脚本
# 前置：网络恢复 + git push 成功
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DMG="$REPO_DIR/apps/desktop/release/财富自由之路-2.0.0-arm64.dmg"
TAG="v2.0.0"

echo "=== Step 1: Push pending commits ==="
cd "$REPO_DIR"
git push origin main
echo "✅ Push done"

echo "=== Step 2: Create tag + release ==="
git tag -a "$TAG" -m "Release v2.0.0 - 全局错误处理 + 多语言 + 数据加密"

gh release create "$TAG" \
  "$DMG" \
  --title "财富自由之路 v2.0.0" \
  --notes-file "$REPO_DIR/RELEASE-v2.0.0.md" \
  --draft

echo "✅ Release draft created! Open https://github.com/petterobam/wealth-freedom/releases to publish."
