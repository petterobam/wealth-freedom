/**
 * 自动测试导出功能
 * 目标：
 * 1. 启动浏览器
 * 2. 打开资产配置页面
 * 3. 自动点击导出按钮
 * 4. 等待 10 秒后检查下载文件
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function autoExportTest() {
  console.log('🚀 开始自动测试导出功能...\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: 500,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    downloadsPath: path.join(__dirname, 'test-downloads'),
  });

  const page = await context.newPage();

  // 收集控制台日志
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
    });
  });

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
      const chartContainers = Array.from(document.querySelectorAll('.chart-container'));

      return chartContainers.map((el, index) => {
        const rect = el.getBoundingClientRect();
        const canvas = el.querySelector('canvas');
        return {
          index,
          containerWidth: rect.width,
          containerHeight: rect.height,
          canvasWidth: canvas?.width,
          canvasHeight: canvas?.height,
        };
      });
    });

    chartStatus.forEach(chart => {
      console.log(`  图表 #${chart.index}: 容器 ${chart.containerWidth}x${chart.containerHeight}px, Canvas ${chart.canvasWidth}x${chart.canvasHeight}px`);
    });

    // 点击导出按钮
    console.log('\n🖱️  点击导出配置报告按钮...');
    const exportButton = await page.$('button:has-text("导出配置报告")');
    if (!exportButton) {
      throw new Error('未找到导出按钮');
    }

    await exportButton.click();
    console.log('✅ 已点击导出按钮');

    // 等待导出完成（10 秒）
    console.log('\n⏱️  等待导出完成（10 秒）...');
    await page.waitForTimeout(10000);

    // 检查下载的文件
    console.log('\n📋 检查下载的文件:');
    const files = fs.readdirSync(downloadDir);
    const imageFiles = files.filter(file =>
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
    );

    console.log(`共 ${imageFiles.length} 个图片文件:`);
    imageFiles.forEach(file => {
      const filePath = path.join(downloadDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  📥 ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });

    const expectedFiles = [
      { name: '资产配置饼图', required: true },
      { name: '风险收益评估雷达图', required: true },
      { name: '收益预测曲线', required: true },
    ];

    console.log('\n🔍 预期文件检查:');
    expectedFiles.forEach(({ name, required }) => {
      const found = imageFiles.some(file => file.includes(name));
      const status = found ? '✅' : '❌';
      console.log(`  ${status} ${name}${required ? ' (必需)' : ''}`);
    });

    // 分析控制台日志
    console.log('\n📋 控制台日志分析:');
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    const warningLogs = consoleLogs.filter(log => log.type === 'warning');

    if (errorLogs.length > 0) {
      console.log('❌ 错误日志:');
      errorLogs.forEach(log => {
        console.log(`  [${log.timestamp}] ${log.text}`);
      });
    }

    if (warningLogs.length > 0) {
      console.log('⚠️  警告日志:');
      warningLogs.slice(0, 5).forEach(log => {
        console.log(`  [${log.timestamp}] ${log.text}`);
      });
    }

    // 查找增长曲线相关的日志
    const growthChartLogs = consoleLogs.filter(log =>
      log.text.includes('增长曲线') || log.text.includes('growthChart') || log.text.includes('growth')
    );
    if (growthChartLogs.length > 0) {
      console.log('\n🔍 增长曲线相关日志:');
      growthChartLogs.forEach(log => {
        console.log(`  [${log.timestamp}] [${log.type}] ${log.text}`);
      });
    }

    // 截图
    const screenshotPath = path.join(downloadDir, `auto-test-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\n📸 页面截图已保存:', screenshotPath);

    // 总结
    console.log('\n✅ 测试完成');
    console.log('\n📊 测试总结:');
    console.log(`  - 图表数量: ${chartStatus.length}`);
    console.log(`  - 下载文件数量: ${imageFiles.length}`);
    console.log(`  - 错误日志数量: ${errorLogs.length}`);
    console.log(`  - 警告日志数量: ${warningLogs.length}`);

    const allExpectedFilesFound = expectedFiles.every(({ name }) =>
      imageFiles.some(file => file.includes(name))
    );

    if (allExpectedFilesFound) {
      console.log('\n✅ 所有预期文件都已成功导出！');
    } else {
      console.log('\n⚠️  部分文件未导出，需要进一步调查');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    await browser.close();
    console.log('\n✅ 浏览器已关闭');
  }
}

// 启动测试
autoExportTest().catch(console.error);
