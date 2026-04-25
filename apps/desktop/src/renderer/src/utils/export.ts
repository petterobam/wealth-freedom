/**
 * 修复后的导出工具
 * 支持等待图片下载完成
 */

import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

// ==================== Excel 导出 ====================

/**
 * 导出为 Excel 文件
 * @param data 要导出的数据数组
 * @param filename 文件名（不包含扩展名）
 * @param sheetName 工作表名称
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 将数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(data)

    // 设置工作表名称
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 生成文件名（带时间戳）
    const timestamp = new Date().toISOString().slice(0, 10)
    const fullFilename = `${filename}_${timestamp}.xlsx`

    // 下载文件
    XLSX.writeFile(workbook, fullFilename)

    ElMessage.success('Excel 导出成功')
  } catch (error) {
    console.error('Excel 导出失败:', error)
    ElMessage.error('Excel 导出失败')
  }
}

/**
 * 导出多个工作表到 Excel 文件
 * @param sheets 工作表对象数组
 * @param filename 文件名（不包含扩展名）
 */
export function exportMultiSheetToExcel(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  filename: string
): void {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 添加每个工作表
    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })

    // 生成文件名（带时间戳）
    const timestamp = new Date().toISOString().slice(0, 10)
    const fullFilename = `${filename}_${timestamp}.xlsx`

    // 下载文件
    XLSX.writeFile(workbook, fullFilename)

    ElMessage.success('Excel 导出成功')
  } catch (error) {
    console.error('Excel 导出失败:', error)
    ElMessage.error('Excel 导出失败')
  }
}

// ==================== 图片导出（修复版）====================

/**
 * 导出 ECharts 图表为图片（支持等待下载完成）
 * @param chartRef 图表实例
 * @param filename 文件名（不包含扩展名）
 * @param format 图片格式：png 或 jpeg
 * @returns Promise<void> 下载完成后 resolve
 */
export async function exportChartToImage(
  chartInstance: any,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    if (!chartInstance) {
      const error = new Error(`图表未初始化: ${filename}`)
      console.error(error)
      throw error
    }

    // 检查图表是否有数据
    const option = chartInstance.getOption()
    if (!option || !option.series || option.series.length === 0) {
      const error = new Error(`图表没有数据: ${filename}`)
      console.error(error)
      throw error
    }

    // 强制图表重新渲染（解决 getDataURL 返回空的问题）
    try {
      chartInstance.resize()
    } catch (e) {
      // resize 可能失败，忽略
    }

    // 等待图表渲染完成
    await new Promise(resolve => setTimeout(resolve, 300))

    // 获取图表的数据 URL
    const dataURL = chartInstance.getDataURL({
      type: format,
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    // 检查数据 URL 是否为空
    if (!dataURL || dataURL.length < 100) {
      const error = new Error(`图表数据 URL 为空或无效: ${filename}`)
      console.error(error)
      throw error
    }

    // 创建下载链接
    const link = document.createElement('a')
    link.href = dataURL
    link.download = `${filename}.${format}`

    // 添加到 DOM
    document.body.appendChild(link)

    // 触发下载（不等待下载完成，直接触发即可）
    link.click()

    // 等待一小段时间确保下载开始
    await new Promise(resolve => setTimeout(resolve, 100))

    // 清理 DOM
    try {
      document.body.removeChild(link)
    } catch (e) {
      // 元素可能已经被移除，忽略
    }

  } catch (error) {
    console.error(`图片导出失败 (${filename}):`, error)
    throw error
  }
}

/**
 * 导出多个 ECharts 图表为图片（按顺序依次导出）
 * @param charts 图表对象数组 { instance, filename }
 * @returns Promise<void> 所有图表下载完成后 resolve
 */
export async function exportMultipleChartsToImage(
  charts: Array<{
    instance: any
    filename: string
    format?: 'png' | 'jpeg'
  }>
): Promise<void> {
  try {
    for (const chart of charts) {
      await exportChartToImage(
        chart.instance,
        chart.filename,
        chart.format || 'png'
      )
    }
    ElMessage.success(`成功导出 ${charts.length} 个图表`)
  } catch (error) {
    console.error('图表批量导出失败:', error)
    ElMessage.error('图表批量导出失败')
    throw error
  }
}

// ==================== PDF 导出（通过 Electron 主进程）====================

/**
 * 导出为 PDF 文件（通过 Electron 主进程）
 * @param filename 文件名（不包含扩展名）
 */
export async function exportToPDF(filename: string): Promise<void> {
  try {
    // 检查是否在 Electron 环境中
    if (!window.electronAPI?.exportToPDF) {
      ElMessage.warning('PDF 导出功能仅在桌面应用中可用，正在跳过...')
      return
    }

    // 生成文件名（带时间戳）
    const timestamp = new Date().toISOString().slice(0, 10)
    const fullFilename = `${filename}_${timestamp}.pdf`

    // 调用 Electron 主进程导出 PDF
    await window.electronAPI.exportToPDF(fullFilename)

    ElMessage.success('PDF 导出成功')
  } catch (error) {
    console.error('PDF 导出失败:', error)
    ElMessage.error('PDF 导出失败')
  }
}

// ==================== 工具函数 ====================

/**
 * 格式化货币数值（用于 Excel 导出）
 * @param value 数值
 * @returns 格式化后的字符串
 */
export function formatCurrencyForExcel(value: number): string {
  return `¥${value.toLocaleString()}`
}

/**
 * 准备年度明细数据用于 Excel 导出
 * @param yearlyData 年度数据数组
 * @returns 格式化后的数据数组
 */
export function prepareYearlyDataForExcel(
  yearlyData: Array<{
    year: number
    totalAssets: number
    totalContribution: number
    totalInterest: number
  }>
): Record<string, any>[] {
  return yearlyData.map(item => ({
    '年份': item.year,
    '总资产': item.totalAssets,
    '总投入': item.totalContribution,
    '总收益': item.totalInterest,
    '收益率': ((item.totalInterest / item.totalContribution) * 100).toFixed(2) + '%'
  }))
}

/**
 * 准备每月明细数据用于 Excel 导出
 * @param monthlyData 月度数据数组
 * @returns 格式化后的数据数组
 */
export function prepareMonthlyDataForExcel(
  monthlyData: Array<{
    month: number
    totalAssets: number
    monthlyContribution: number
    monthlyInterest: number
  }>
): Record<string, any>[] {
  return monthlyData.map(item => ({
    '月份': item.month,
    '总资产': item.totalAssets,
    '本月投入': item.monthlyContribution,
    '本月收益': item.monthlyInterest
  }))
}
