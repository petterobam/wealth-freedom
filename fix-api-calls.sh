#!/bin/bash

# 修复 window.api 到 window.electronAPI 的迁移

cd "/Users/oyj/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom/apps/desktop/src/renderer/src/stores"

# 使用 perl 替换（macOS 兼容）
for file in *.ts; do
  perl -i -pe 's/window\.api\./window.electronAPI./g' "$file"
  echo "已修复: $file"
done

echo "所有 store 文件已修复！"
