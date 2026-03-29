const fs = require('fs');
const path = require('path');

// 5 个工具的映射关系
const tools = [
  {
    name: 'RetirementPlanner.vue',
    tutorial: 'retirementTutorial',
    params: [
      { label: '当前年龄', param: 'currentAge' },
      { label: '退休年龄', param: 'retirementAge' },
      { label: '当前储蓄', param: 'currentSavings' },
      { label: '每月储蓄', param: 'monthlySavings' },
      { label: '退休后月支出', param: 'retirementExpenses' },
      { label: '预期寿命', param: 'lifeExpectancy' },
      { label: '年化收益率', param: 'expectedReturn' }
    ],
    exampleData: {
      currentAge: '30',
      retirementAge: '60',
      currentSavings: '1100000',
      monthlySavings: '20000',
      retirementExpenses: '10000',
      lifeExpectancy: '85',
      expectedReturn: '8',
      inflationRate: '3'
    }
  },
  {
    name: 'LargeExpensePlanner.vue',
    tutorial: 'largeExpenseTutorial',
    params: [
      { label: '目标名称', param: 'goalName' },
      { label: '目标金额', param: 'targetAmount' },
      { label: '达成年限', param: 'yearsToTarget' },
      { label: '当前储蓄', param: 'currentSavings' },
      { label: '每月储蓄', param: 'monthlySavings' },
      { label: '年化收益率', param: 'annualRate' }
    ],
    exampleData: {
      goalName: '买房首付',
      targetAmount: '1000000',
      yearsToTarget: '3',
      currentSavings: '200000',
      monthlySavings: '20000',
      annualRate: '5'
    }
  },
  {
    name: 'ScenarioSimulator.vue',
    tutorial: 'scenarioTutorial',
    params: [
      { label: '净资产', param: 'netAssets' },
      { label: '月收入', param: 'monthlyIncome' },
      { label: '月支出', param: 'monthlyExpense' },
      { label: '年化收益率', param: 'annualReturn' },
      { label: '财务自由目标', param: 'financialFreedomTarget' }
    ],
    exampleData: {
      netAssets: '1100000',
      monthlyIncome: '30000',
      monthlyExpense: '10000',
      annualReturn: '8',
      financialFreedomTarget: '1500000'
    }
  }
];

// 读取文件
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// 写入文件
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

// 修改导入
function modifyImports(content, tutorial) {
  const importsPattern = /import \{ ([^}]+) \} from '@element-plus\/icons-vue'/;
  const match = content.match(importsPattern);

  if (match) {
    const icons = match[1];
    if (!icons.includes('DocumentCopy')) {
      const newIcons = icons.trim() + ', DocumentCopy';
      content = content.replace(importsPattern, `import { ${newIcons} } from '@element-plus/icons-vue'`);
    }
  }

  // 添加 HelpTooltip 和 tutorial 导入
  if (!content.includes('HelpTooltip')) {
    const importPattern = /import \{ ElMessage \} from 'element-plus'/;
    content = content.replace(
      importPattern,
      `import { ElMessage } from 'element-plus'\nimport HelpTooltip from '../components/HelpTooltip.vue'\nimport { ${tutorial} } from '../utils/tutorial-content'`
    );
  }

  return content;
}

// 修改表单（添加 HelpTooltip）
function modifyForm(content, params) {
  params.forEach(({ label, param }) => {
    const pattern = new RegExp(`(<el-form-item label="${label}">[\\s\\S]*?<span class="unit">)([\\s\\S]*?)(</el-form-item>)`, 'g');
    content = content.replace(pattern, `$1$2$2\n          <HelpTooltip :content="${tutorial}.parameters.${param}" />$3`);
  });

  return content;
}

// 添加示例数据按钮
function addExampleButton(content) {
  const buttonPattern = /(el-button type="success" @click="openScenarioDialog">[\s\S]*?<\/el-button>)/;
  const exampleButton = `
          <el-button type="warning" @click="loadExampleData">
            <el-icon><DocumentCopy /></el-icon>
            示例数据
          </el-button>`;

  if (!content.includes('示例数据')) {
    content = content.replace(buttonPattern, `$1${exampleButton}`);
  }

  return content;
}

// 添加 loadExampleData 函数
function addLoadExampleFunction(content, tool) {
  if (content.includes('loadExampleData')) {
    return content;
  }

  // 查找 handleReset 函数并添加 loadExampleData
  const resetPattern = /(function handleReset\(\) \{[\s\S]*?result\.value = null\s*\})/;
  const exampleFunction = `
$1

// 加载示例数据
const loadExampleData = () => {
  ${Object.entries(tool.exampleData).map(([key, value]) => `plannerForm.${key} = ${value}`).join('\n  ')}
  result.value = null
  ElMessage.success('示例数据加载成功，点击"计算"查看结果')
}`;

  // 针对 ScenarioSimulator，需要使用 currentScenario
  if (tool.name === 'ScenarioSimulator.vue') {
    const scenarioExampleFunction = `
$1

// 加载示例数据
const loadExampleData = () => {
  ${Object.entries(tool.exampleData).map(([key, value]) => `currentScenario.value.${key} = ${value}`).join('\n  ')}
  result.value = null
  ElMessage.success('示例数据加载成功，点击"计算"查看结果')
}`;
    content = content.replace(resetPattern, scenarioExampleFunction);
  } else {
    content = content.replace(resetPattern, exampleFunction);
  }

  return content;
}

// 主函数
function main() {
  const baseDir = path.join(__dirname, '../apps/desktop/src/renderer/src/views');

  tools.forEach(tool => {
    const filePath = path.join(baseDir, tool.name);
    console.log(`\n处理: ${tool.name}`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return;
    }

    let content = readFile(filePath);

    // 1. 修改导入
    console.log('  1. 修改导入...');
    content = modifyImports(content, tool.tutorial);

    // 2. 修改表单（添加 HelpTooltip）
    console.log('  2. 添加参数说明...');
    content = modifyForm(content, tool.params, tool.tutorial);

    // 3. 添加示例数据按钮
    console.log('  3. 添加示例数据按钮...');
    content = addExampleButton(content);

    // 4. 添加 loadExampleData 函数
    console.log('  4. 添加示例数据函数...');
    content = addLoadExampleFunction(content, tool);

    // 写入文件
    writeFile(filePath, content);
    console.log(`✅ ${tool.name} 处理完成`);
  });

  console.log('\n所有工具处理完成！');
}

main();
