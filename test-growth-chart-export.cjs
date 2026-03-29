/**
 * 测试增长曲线导出功能
 * 使用 Playwright 在浏览器环境中测试
 */

const { chromium } = require('playwright');

async function testGrowthChartExport() {
  console.log('🚀 启动测试: 增长曲线导出功能\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有下载事件
  let downloads = [];
  page.on('download', async (download) => {
    const filename = download.suggestedFilename();
    const size = await download.createReadStream().then(stream => {
      return new Promise((resolve, reject) => {
        let size = 0;
        stream.on('data', (chunk) => {
          size += chunk.length;
        });
        stream.on('end', () => resolve(size));
        stream.on('error', reject);
      });
    });

    const sizeKB = (size / 1024).toFixed(2);
    console.log(`\n📥 下载文件: ${filename} (${sizeKB} KB)`);
    downloads.push({ filename, sizeKB });

    // 检查图片是否有效
    try {
      const path = `/tmp/${filename}`;
      await download.saveAs(path);
      console.log(`   ✅ 文件已保存到: ${path}`);

      // 检查图片文件大小
      if (size < 1000) {
        console.log(`   ⚠️  警告: 文件大小过小 (${size} bytes)，可能是空文件`);
      }
    } catch (error) {
      console.error(`   ❌ 保存文件失败:`, error.message);
    }
  });

  // 监听控制台日志
  page.on('console', (msg) => {
    const text = msg.text();
    // 捕获所有日志，包括错误
    if (text.includes('图表') || text.includes('导出') || text.includes('实例') || text.includes('数据 URL') ||
        text.includes('Error') || text.includes('错误') || text.includes('失败') || text.includes('成功')) {
      console.log(`📜 浏览器控制台 [${msg.type()}]: ${text}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', (error) => {
    console.error(`❌ 页面错误: ${error.message}`);
  });

  try {
    console.log('📍 导航到页面...');
    await page.goto('http://localhost:5179/#/asset-allocation', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ 页面加载完成\n');

    // 等待页面完全加载和 Vue 应用初始化
    console.log('⏳ 等待 Vue 应用初始化...');
    await page.waitForTimeout(5000);

    // 等待 #app 元素出现并包含子元素
    console.log('⏳ 等待 #app 元素...');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('🔍 检查图表元素...');

    // 检查增长曲线图表容器
    const growthChartContainer = await page.$('.finance-card .chart-container:nth-of-type(3)');
    if (!growthChartContainer) {
      console.error('❌ 未找到增长曲线图表容器');
    } else {
      console.log('✅ 增长曲线图表容器存在');
    }

    // 检查增长曲线图表的 Canvas 元素
    const canvasElements = await page.$$('canvas');
    console.log(`📊 找到 ${canvasElements.length} 个 Canvas 元素`);

    if (canvasElements.length >= 3) {
      console.log('✅ 增长曲线图表 Canvas 存在（第3个）');

      // 检查 Canvas 是否有内容
      const canvas3Size = await canvasElements[2].evaluate(el => {
        return {
          width: el.width,
          height: el.height,
          dataURL: el.toDataURL().substring(0, 100) // 只取前100个字符
        };
      });

      console.log(`   Canvas 3 尺寸: ${canvas3Size.width}x${canvas3Size.height}`);
      console.log(`   Canvas 3 DataURL 前缀: ${canvas3Size.dataURL.substring(0, 30)}...`);

      if (canvas3Size.width === 0 || canvas3Size.height === 0) {
        console.error('❌ Canvas 尺寸为 0，图表未正确渲染');
      } else {
        console.log('✅ Canvas 尺寸正常');
      }
    } else {
      console.error(`❌ Canvas 元素数量不足 (期望: >=3, 实际: ${canvasElements.length})`);
    }

    console.log('\n🔍 检查图表实例和配置...');

    // 注入 JavaScript 检查图表实例
    const chartInstanceCheck = await page.evaluate(() => {
      // 检查 Vue 实例中的图表实例
      const result = {
        growthChartInstanceExists: false,
        growthChartOption: null,
        growthChartSeriesLength: 0
      };

      // 尝试通过 Vue 应用实例访问
      const vueApp = document.querySelector('#app').__vueParentComponent;

      if (vueApp) {
        console.log('Vue 应用实例存在');
        // 注意：这里可能需要根据实际的 Vue 结构调整访问方式
      }

      return result;
    });

    console.log(`   图表实例检查:`, JSON.stringify(chartInstanceCheck));

    console.log('\n🖱️ 点击"导出配置报告"按钮...');

    // 查找并点击导出按钮
    const exportButton = await page.$('button:has-text("导出配置报告")');
    if (!exportButton) {
      console.error('❌ 未找到导出按钮');
      throw new Error('导出按钮不存在');
    }

    await exportButton.click();
    console.log('✅ 导出按钮已点击\n');

    // 等待下载完成
    console.log('⏳ 等待文件下载...');
    await page.waitForTimeout(5000);

    console.log('\n📋 测试结果汇总:');
    console.log(`   总共下载文件数: ${downloads.length}`);
    console.log('   下载文件列表:');
    downloads.forEach((file, index) => {
      console.log(`     ${index + 1}. ${file.filename} (${file.sizeKB} KB)`);
    });

    // 检查是否成功下载了增长曲线图片
    const growthChartFile = downloads.find(f => f.filename.includes('收益预测曲线'));
    if (growthChartFile) {
      console.log(`\n✅ 增长曲线导出成功！`);
      console.log(`   文件名: ${growthChartFile.filename}`);
      console.log(`   文件大小: ${growthChartFile.sizeKB} KB`);
    } else {
      console.log(`\n❌ 增长曲线导出失败！`);
      console.log('   原因：未找到相关下载文件');
    }

    // 检查其他图表
    const pieChartFile = downloads.find(f => f.filename.includes('资产配置饼图'));
    const radarChartFile = downloads.find(f => f.filename.includes('风险收益评估雷达图'));

    console.log('\n📊 所有图表导出状态:');
    console.log(`   饼图: ${pieChartFile ? '✅' : '❌'}`);
    console.log(`   雷达图: ${radarChartFile ? '✅' : '❌'}`);
    console.log(`   增长曲线: ${growthChartFile ? '✅' : '❌'}`);

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n🔚 测试结束');
    await browser.close();
  }
}

// 运行测试
testGrowthChartExport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
