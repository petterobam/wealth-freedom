const fs = require('fs')
const path = require('path')

// 需要添加响应式样式的工具列表
const tools = [
  {
    name: '提前还款计算器',
    filename: 'PrepaymentCalculator.vue',
    metricColumns: 3,
    hasGoals: false
  },
  {
    name: '退休规划工具',
    filename: 'RetirementPlanner.vue',
    metricColumns: 4,
    hasGoals: false
  },
  {
    name: '大额支出规划',
    filename: 'LargeExpensePlanner.vue',
    metricColumns: 3,
    hasGoals: false
  },
  {
    name: '情景模拟',
    filename: 'ScenarioSimulator.vue',
    metricColumns: 3,
    hasGoals: false
  }
]

// 响应式样式模板
const responsiveStyleTemplate = (metricColumns, hasGoals) => `
  <style lang="scss" scoped>
  .calculator {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;

      @media (max-width: 575px) {
        font-size: 20px;
        margin-bottom: 16px;
      }
    }

    .input-card {
      margin-bottom: 24px;

      @media (max-width: 575px) {
        margin-bottom: 16px;
      }

      .calculator-form {
        margin-top: 20px;

        @media (max-width: 575px) {
          margin-top: 16px;
        }

        .el-form-item {
          margin-bottom: 20px;

          @media (max-width: 575px) {
            margin-bottom: 16px;
          }
        }

        .unit {
          margin-left: 8px;
          color: #909399;
          font-size: 14px;

          @media (max-width: 575px) {
            font-size: 13px;
          }
        }

        .el-slider {
          margin-right: 20px;

          @media (max-width: 575px) {
            margin-right: 10px;
          }
        }
      }
    }

    .result-section {
      margin-top: 24px;

      @media (max-width: 575px) {
        margin-top: 20px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;

        @media (max-width: 575px) {
          font-size: 14px;
          margin-bottom: 12px;
        }
      }

      .metric-cards {
        display: grid;
        grid-template-columns: repeat(${metricColumns}, 1fr);
        gap: 16px;
        margin-bottom: 24px;

        @media (max-width: 575px) {
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) and (max-width: 991px) {
          grid-template-columns: repeat(${Math.min(metricColumns, 3)}, 1fr);
          gap: 14px;
        }
      }

      .metric-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 12px;
        color: #fff;

        @media (max-width: 575px) {
          padding: 16px;
          gap: 12px;
          flex-direction: column;
          text-align: center;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          padding: 18px;
          gap: 14px;
        }

        .metric-icon {
          font-size: 36px;

          @media (max-width: 575px) {
            font-size: 32px;
          }
        }

        .metric-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 4px;

          @media (max-width: 575px) {
            font-size: 13px;
          }
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;

          @media (max-width: 575px) {
            font-size: 20px;
          }

          @media (min-width: 576px) and (max-width: 767px) {
            font-size: 22px;
          }
        }
      }

      .chart-card {
        margin-bottom: 24px;

        @media (max-width: 575px) {
          margin-bottom: 16px;
        }

        .chart-container {
          height: 350px;

          @media (max-width: 575px) {
            height: 280px;
          }

          @media (min-width: 576px) and (max-width: 767px) {
            height: 320px;
          }

          @media (min-width: 768px) and (max-width: 991px) {
            height: 340px;
          }
        }
      }

      .table-card {
        margin-bottom: 24px;

        @media (max-width: 575px) {
          margin-bottom: 16px;
        }
      }
    }${hasGoals ? `

    .goals-card {
      margin-top: 24px;

      @media (max-width: 575px) {
        margin-top: 20px;
      }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 20px;

        @media (max-width: 575px) {
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
      }

      .goal-item {
        background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        border: 1px solid #e4e7ed;

        @media (max-width: 575px) {
          padding: 16px;
        }

        .goal-icon {
          font-size: 48px;
          margin-bottom: 12px;

          @media (max-width: 575px) {
            font-size: 40px;
            margin-bottom: 10px;
          }
        }

        .goal-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;

          @media (max-width: 575px) {
            font-size: 14px;
            margin-bottom: 6px;
          }
        }

        .goal-amount {
          font-size: 24px;
          font-weight: 700;
          color: #409eff;
          margin-bottom: 12px;

          @media (max-width: 575px) {
            font-size: 20px;
            margin-bottom: 10px;
          }

          @media (min-width: 576px) and (max-width: 767px) {
            font-size: 22px;
          }
        }

        .goal-time {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          color: #67c23a;
          font-weight: 600;
          margin-bottom: 12px;

          @media (max-width: 575px) {
            font-size: 14px;
            margin-bottom: 10px;
            flex-direction: column;
            gap: 4px;
          }
        }

        .goal-status {
          margin-top: 8px;

          @media (max-width: 575px) {
            margin-top: 6px;
          }
        }
      }
    }` : ''}
  }

  .gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .gradient-success {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  }

  .gradient-info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .gradient-warning {
    background: linear-gradient(135deg, #e6a23c 0%, #f5a623 100%);
  }

  .scenario-actions {
    display: flex;
    gap: 12px;
    align-items: center;

    @media (max-width: 575px) {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
  }

  .scenario-list {
    margin-top: 20px;

    @media (max-width: 575px) {
      margin-top: 16px;
    }
  }

  .scenario-params {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #606266;

    @media (max-width: 575px) {
      font-size: 11px;
    }
  }
  </style>`

// 主函数
function main() {
  const basePath = path.join(__dirname, '../apps/desktop/src/renderer/src/views')

  tools.forEach(tool => {
    const filePath = path.join(basePath, tool.filename)

    console.log(`处理 ${tool.name}...`)

    try {
      let content = fs.readFileSync(filePath, 'utf-8')

      // 检查是否已经有响应式样式
      if (content.includes('@media (max-width: 575px)')) {
        console.log(`  ✓ ${tool.name} 已包含响应式样式，跳过`)
        return
      }

      // 替换样式部分
      const styleStart = content.indexOf('<style')
      const styleEnd = content.indexOf('</style>') + 8

      if (styleStart === -1 || styleEnd === -1) {
        console.log(`  ✗ ${tool.name} 未找到样式标签`)
        return
      }

      // 获取 <style> 标签内的内容（包含 <style> 和 </style>）
      const oldStyle = content.substring(styleStart, styleEnd)

      // 提取 lang="scss" scoped
      const styleTagMatch = oldStyle.match(/<style(.*?)>/)
      const styleAttributes = styleTagMatch ? styleTagMatch[1] : ' lang="scss" scoped'

      // 创建新的样式标签
      const newStyle = `<style${styleAttributes}>` + responsiveStyleTemplate(tool.metricColumns, tool.hasGoals) + '\n'

      // 替换样式部分
      content = content.substring(0, styleStart) + newStyle

      // 写入文件
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`  ✓ ${tool.name} 响应式样式添加成功`)

    } catch (error) {
      console.error(`  ✗ ${tool.name} 处理失败:`, error.message)
    }
  })

  console.log('\n所有工具响应式样式添加完成！')
}

// 执行
main()
