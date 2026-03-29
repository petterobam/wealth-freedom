/**
 * 手动测试导出功能
 * 目标：
 * 1. 启动浏览器，显示窗口
 * 2. 打开资产配置页面
 * 3. 等待用户手动点击导出按钮
 * 4. 检查下载目录中的文件
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function manualExportTest() {
  console.log('🚀 开始手动测试导出功能...\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: 100,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    // 设置下载目录为项目目录
    downloadsPath: path.join(__dirname, 'test-downloads'),
  });

  const page = await context.newPage();

  try {
    // 创建下载目录
    const downloadDir = path.join(__dirname, 'test-downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
      console.log('📁 创建下载目录:', downloadDir);
    }

    // 清空下载目录
    const existingFiles = fs.readdirSync(downloadDir);
    existingFiles.forEach(file => {
      fs.unlinkSync(path.join(downloadDir, file));
    });
    console.log('🗑️  清空下载目录\n');

    const url = 'http://localhost:5181/#/asset-allocation';
    console.log('🌐 访问页面:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 检查图表容器
    console.log('\n📊 检查图表容器状态:');
    const chartStatus = await page.evaluate(() => {
      const getContainerInfo = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
        };
      };

      const getCanvasInfo = (el) => {
        if (!el) return null;
        const canvas = el.querySelector('canvas');
        if (!canvas) return null;
        return {
          width: canvas.width,
          height: canvas.height,
        };
      };

      // 查找所有 chart-container 元素
      const chartContainers = Array.from(document.querySelectorAll('.chart-container'));

      return {
        totalChartContainers: chartContainers.length,
        charts: chartContainers.map((el, index) => ({
          index,
          container: getContainerInfo(el),
          canvas: getCanvasInfo(el),
        })),
      };
    });

    console.log(`找到 ${chartStatus.totalChartContainers} 个图表容器:`);
    chartStatus.charts.forEach(chart => {
      console.log(`  图表 #${chart.index}:`);
      console.log(`    容器: ${chart.container.width}x${chart.container.height}px`);
      if (chart.canvas) {
        console.log(`    Canvas: ${chart.canvas.width}x${chart.canvas.height}px`);
      }
    });

    console.log('\n✅ 浏览器已打开页面，请手动点击"导出配置报告"按钮');
    console.log('⏱️  等待导出完成（按 Ctrl+C 停止）...\n');

    // 持续监控下载目录
    let lastFileCount = 0;
    const monitorInterval = setInterval(() => {
      const files = fs.readdirSync(downloadDir);
      const imageFiles = files.filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );

      if (imageFiles.length > lastFileCount) {
        console.log(`📥 检测到新文件: ${imageFiles.slice(lastFileCount).join(', ')}`);
        lastFileCount = imageFiles.length;
      }
    }, 1000);

    // 等待用户手动操作（无限等待，直到用户停止脚本）
    await new Promise(() => {}); // 永远不会 resolve

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('\n⏹️  用户停止测试');
    } else {
      console.error('\n❌ 错误:', error);
    }
  } finally {
    clearInterval(monitorInterval);

    // 最终检查下载的文件
    console.log('\n📋 最终文件列表:');
    const downloadDir = path.join(__dirname, 'test-downloads');
    if (fs.existsSync(downloadDir)) {
      const files = fs.readdirSync(downloadDir);
      const imageFiles = files.filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );

      console.log(`共 ${imageFiles.length} 个图片文件:`);
      imageFiles.forEach(file => {
        const filePath = path.join(downloadDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      });

      const expectedFiles = [
        '资产配置饼图',
        '风险收益评估雷达图',
        '收益预测曲线',
      ];

      console.log('\n🔍 预期文件检查:');
      expectedFiles.forEach(expectedFile => {
        const found = imageFiles.some(file => file.includes(expectedFile));
        console.log(`  ${found ? '✅' : '❌'} ${expectedFile}`);
      });
    }

    await browser.close();
    console.log('\n✅ 测试结束');
  }
}

// 启动测试
manualExportTest().catch(console.error);
