#!/bin/bash

# 图标生成脚本
# 从 icon.svg 生成各平台所需的图标文件

set -e

BUILD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_SVG="$BUILD_DIR/icon.svg"

echo "🎨 开始生成图标文件..."

# 检查 icon.svg 是否存在
if [ ! -f "$ICON_SVG" ]; then
    echo "❌ 错误：找不到 $ICON_SVG"
    exit 1
fi

# 检查 ImageMagick 是否安装
if ! command -v magick &> /dev/null; then
    echo "❌ 错误：ImageMagick 未安装"
    echo "请运行：brew install imagemagick"
    exit 1
fi

# 生成 icon.png (Linux)
echo "📦 生成 icon.png..."
magick "$ICON_SVG" -resize 512x512 "$BUILD_DIR/icon.png"

# 生成 icon.ico (Windows)
echo "📦 生成 icon.ico..."
magick "$ICON_SVG" -resize 256x256 "$BUILD_DIR/icon.ico"

# 生成 icon.icns (macOS)
echo "📦 生成 icon.icns..."
# macOS 图标需要使用 iconutil，需要先创建 iconset
ICONSET_DIR="$BUILD_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

# 生成不同尺寸的图标文件
magick "$ICON_SVG" -resize 16x16 "$ICONSET_DIR/icon_16x16.png"
magick "$ICON_SVG" -resize 32x32 "$ICONSET_DIR/icon_16x16@2x.png"
magick "$ICON_SVG" -resize 32x32 "$ICONSET_DIR/icon_32x32.png"
magick "$ICON_SVG" -resize 64x64 "$ICONSET_DIR/icon_32x32@2x.png"
magick "$ICON_SVG" -resize 128x128 "$ICONSET_DIR/icon_128x128.png"
magick "$ICON_SVG" -resize 256x256 "$ICONSET_DIR/icon_128x128@2x.png"
magick "$ICON_SVG" -resize 256x256 "$ICONSET_DIR/icon_256x256.png"
magick "$ICON_SVG" -resize 512x512 "$ICONSET_DIR/icon_256x256@2x.png"
magick "$ICON_SVG" -resize 512x512 "$ICONSET_DIR/icon_512x512.png"
magick "$ICON_SVG" -resize 1024x1024 "$ICONSET_DIR/icon_512x512@2x.png"

# 使用 iconutil 生成 icns 文件
iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"

# 清理临时文件
rm -rf "$ICONSET_DIR"

echo "✅ 图标生成完成！"
echo "   - icon.png: 512x512 (Linux)"
echo "   - icon.ico: 256x256 (Windows)"
echo "   - icon.icns: macOS (16x16 到 1024x1024)"
