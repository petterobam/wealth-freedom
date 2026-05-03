/**
 * 图表优化工具
 * 提供统一的图表配置和交互优化方案
 */

import * as echarts from 'echarts'

/**
 * 优化的 tooltip 配置
 */
export const optimizedTooltip = {
  trigger: 'axis',
  axisPointer: {
    type: 'cross',
    label: {
      backgroundColor: '#6a7985'
    }
  },
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#ccc',
  borderWidth: 1,
  textStyle: {
    color: '#333'
  },
  formatter: (params: any) => {
    if (!params || params.length === 0) return ''

    let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`

    params.forEach((param: any) => {
      const value = param.value
      const marker = param.marker
      const seriesName = param.seriesName

      result += `<div style="margin: 4px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="margin-right: 12px;">${marker}${seriesName}</span>
        <span style="font-weight: 600;">${formatCurrency(value)}</span>
      </div>`

      // 添加详细信息
      if (param.data && param.data.details) {
        result += `<div style="margin: 4px 0; padding-left: 20px; font-size: 12px; color: #666;">`
        Object.entries(param.data.details).forEach(([key, val]: [string, any]) => {
          result += `<div>${key}: ${formatCurrency(val)}</div>`
        })
        result += '</div>'
      }
    })

    return result
  }
}

/**
 * 数据缩放配置（滑块和框选）
 */
export const optimizedDataZoom = [
  {
    type: 'slider',
    show: true,
    xAxisIndex: [0],
    start: 0,
    end: 100,
    height: 30,
    bottom: 10,
    handleStyle: {
      color: '#5470C6'
    },
    textStyle: {
      color: '#666'
    }
  },
  {
    type: 'inside',
    xAxisIndex: [0],
    start: 0,
    end: 100,
    zoomOnMouseWheel: true,
    moveOnMouseMove: true
  }
]

/**
 * 工具箱配置（保存图片、数据视图、还原）
 */
export const optimizedToolbox = {
  show: true,
  feature: {
    saveAsImage: {
      show: true,
      title: '保存为图片',
      type: 'png',
      pixelRatio: 2
    },
    dataView: {
      show: true,
      title: '数据视图',
      readOnly: true,
      lang: ['数据视图', '关闭', '刷新']
    },
    restore: {
      show: true,
      title: '还原'
    }
  },
  right: 20,
  top: 10
}

/**
 * 优化的网格配置
 */
export const optimizedGrid = {
  left: '3%',
  right: '4%',
  bottom: '15%',
  top: '15%',
  containLabel: true
}

/**
 * 优化的动画配置
 */
export const optimizedAnimation = {
  animation: true as const,
  animationDuration: 1000,
  animationEasing: 'cubicInOut',
  animationDelay: 0
}

/**
 * 格式化金额
 */
export function formatCurrency(value: number): string {
  if (value === null || value === undefined) return '¥0'
  if (value >= 100000000) {
    return '¥' + (value / 100000000).toFixed(2) + '亿'
  }
  if (value >= 10000) {
    return '¥' + (value / 10000).toFixed(2) + '万'
  }
  return '¥' + value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

/**
 * 获取通用图表配置
 */
export function getCommonChartConfig() {
  return {
    tooltip: optimizedTooltip,
    animation: optimizedAnimation,
    grid: optimizedGrid,
    toolbox: optimizedToolbox
  }
}

/**
 * 获取带缩放的图表配置
 */
export function getZoomChartConfig() {
  return {
    ...getCommonChartConfig(),
    dataZoom: optimizedDataZoom
  }
}

/**
 * 复利计算器图表配置
 */
export function getCalculatorChartConfig(
  years: string[],
  assetsData: number[],
  contributionData: number[],
  interestData: number[]
) {
  return {
    ...getZoomChartConfig(),
    legend: {
      data: ['总资产', '总投入', '总收益'],
      top: 5
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        interval: Math.floor(years.length / 10),
        rotate: years.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        }
      }
    },
    series: [
      {
        name: '总资产',
        type: 'line',
        data: assetsData.map((val, idx) => ({
          value: val,
          details: {
            '总投入': contributionData[idx],
            '总收益': interestData[idx]
          }
        })),
        smooth: true,
        itemStyle: { color: '#4facfe' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 172, 254, 0.3)' },
            { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '总投入',
        type: 'line',
        data: contributionData,
        smooth: true,
        itemStyle: { color: '#67c23a' },
        lineStyle: { type: 'dashed' },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '总收益',
        type: 'line',
        data: interestData,
        smooth: true,
        itemStyle: { color: '#e6a23c' },
        lineStyle: { type: 'dashed' },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
}

/**
 * 提前还款计算器图表配置
 */
export function getPrepaymentChartConfig(
  months: string[],
  remainingPrincipalData: number[],
  totalPaymentData: number[]
) {
  return {
    ...getZoomChartConfig(),
    legend: {
      data: ['剩余本金', '累计还款'],
      top: 5
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        interval: Math.floor(months.length / 10),
        rotate: months.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        }
      }
    },
    series: [
      {
        name: '剩余本金',
        type: 'line',
        data: remainingPrincipalData,
        smooth: true,
        itemStyle: { color: '#e6a23c' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '累计还款',
        type: 'line',
        data: totalPaymentData,
        smooth: true,
        itemStyle: { color: '#409eff' },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
}

/**
 * 退休规划工具图表配置
 */
export function getRetirementChartConfig(
  years: string[],
  savingsData: number[],
  expensesData: number[]
) {
  return {
    ...getZoomChartConfig(),
    legend: {
      data: ['储蓄', '支出'],
      top: 5
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        interval: Math.floor(years.length / 10),
        rotate: years.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        }
      }
    },
    series: [
      {
        name: '储蓄',
        type: 'line',
        data: savingsData.map((val, idx) => ({
          value: val,
          details: {
            '当年支出': expensesData[idx] || 0
          }
        })),
        smooth: true,
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '支出',
        type: 'line',
        data: expensesData,
        smooth: true,
        itemStyle: { color: '#f56c6c' },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
}

/**
 * 大额支出规划图表配置
 */
export function getLargeExpenseChartConfig(
  years: string[],
  targetData: number[],
  assetsData: number[]
) {
  return {
    ...getZoomChartConfig(),
    legend: {
      data: ['目标金额', '未来资产'],
      top: 5
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        interval: Math.floor(years.length / 10),
        rotate: years.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        }
      }
    },
    series: [
      {
        name: '目标金额',
        type: 'line',
        data: targetData,
        smooth: true,
        itemStyle: { color: '#909399' },
        lineStyle: { type: 'dashed' },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '未来资产',
        type: 'line',
        data: assetsData.map((val, idx) => ({
          value: val,
          details: {
            '目标金额': targetData[idx],
            '差距': val - targetData[idx]
          }
        })),
        smooth: true,
        itemStyle: { color: '#4facfe' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 172, 254, 0.3)' },
            { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
}

/**
 * 情景模拟图表配置
 */
export function getScenarioChartConfig(
  years: string[],
  currentAssetsData: number[],
  newAssetsData: number[]
) {
  return {
    ...getZoomChartConfig(),
    legend: {
      data: ['当前场景', '新场景'],
      top: 5
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        interval: Math.floor(years.length / 10),
        rotate: years.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        }
      }
    },
    series: [
      {
        name: '当前场景',
        type: 'line',
        data: currentAssetsData,
        smooth: true,
        itemStyle: { color: '#909399' },
        lineStyle: { type: 'dashed' },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '新场景',
        type: 'line',
        data: newAssetsData.map((val, idx) => ({
          value: val,
          details: {
            '当前场景': currentAssetsData[idx],
            '差距': val - currentAssetsData[idx]
          }
        })),
        smooth: true,
        itemStyle: { color: '#4facfe' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 172, 254, 0.3)' },
            { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }
}
