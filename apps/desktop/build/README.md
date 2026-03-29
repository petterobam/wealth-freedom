# 产品图标说明

本目录包含产品的图标和品牌素材。

---

## 图标文件

| 文件 | 用途 | 状态 |
|------|------|------|
| icon.svg | 源文件（矢量） | ✅ 已创建 |
| icon.icns | macOS 应用图标 | ⏳ 需要转换 |
| icon.ico | Windows 应用图标 | ⏳ 需要转换 |
| icon.png | Linux 应用图标 | ⏳ 需要转换 |

---

## 图标设计说明

**设计理念**：
- 渐变背景（#667eea → #764ba2）：代表从保障到自由的过渡
- 上升箭头：代表财富增长
- 进度条：代表财务自由进度追踪

**颜色**：
- 主色：#667eea（紫蓝渐变）
- 强调色：#ffd700（金色）
- 成功色：#67c23a（绿色）

---

## 如何转换图标

### 方法一：在线工具（推荐）

1. 访问 https://cloudconvert.com/svg-to-icns
2. 上传 icon.svg
3. 选择目标格式（icns/ico/png）
4. 下载转换后的文件

### 方法二：使用命令行

**macOS (.icns)**:
```bash
# 创建 iconset 目录
mkdir icon.iconset

# 生成各种尺寸
sips -z 16 16     icon.svg --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.svg --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.svg --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.svg --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.svg --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.svg --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.svg --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.svg --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.svg --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.svg --out icon.iconset/icon_512x512@2x.png

# 生成 icns
iconutil -c icns icon.iconset -o icon.icns
```

**Windows (.ico)**:
```bash
# 需要安装 ImageMagick
convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

**Linux (.png)**:
```bash
# 需要安装 Inkscape 或 rsvg-convert
inkscape icon.svg -w 512 -h 512 -o icon.png
# 或
rsvg-convert -w 512 -h 512 icon.svg -o icon.png
```

---

## 品牌素材清单

除了应用图标，还需要准备以下素材：

### 官网素材

- [ ] Logo（横版，用于官网顶部）
- [ ] 产品截图（至少 3 张）
- [ ] 功能演示 GIF（可选）

### 社交媒体素材

- [ ] 微信分享图标（300x300）
- [ ] 小红书封面图（1242x1660）
- [ ] 知乎回答配图（可选）

### App Store 素材（如果上架）

- [ ] 应用截图（macOS: 1280x800 或 2880x1800）
- [ ] 预览视频（可选）
- [ ] 宣传图（1024x1024）

---

## 当前状态

- ✅ SVG 源文件已创建
- ⏳ 需要转换为 icns/ico/png
- ⏳ 需要准备产品截图
- ⏳ 需要准备社交媒体素材

---

**建议**：先启动产品，截图后再批量准备所有素材。
