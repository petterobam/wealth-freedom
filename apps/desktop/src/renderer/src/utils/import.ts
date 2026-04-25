/**
 * 数据导入工具
 * 支持 JSON 和 Excel 格式导入，与 export.ts 导出的数据格式兼容
 */

import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

// ==================== 类型定义 ====================

export type ImportMode = 'replace' | 'incremental'

export interface ImportResult {
  success: boolean
  message: string
  imported: {
    accounts: number
    debts: number
    transactions: number
    goals: number
    skipped: number
  }
}

export interface ImportPreview {
  accounts: number
  debts: number
  transactions: number
  goals: number
  hasUser: boolean
  hasSettings: boolean
  exportedAt: string
}

/**
 * 生成导入预览摘要（不执行写入）
 * 用于在确认弹窗中显示将要导入的数据量
 */
export function previewImport(data: FullBackupData): ImportPreview {
  return {
    accounts: data.accounts?.length ?? 0,
    debts: data.debts?.length ?? 0,
    transactions: data.transactions?.length ?? 0,
    goals: data.goals?.length ?? 0,
    hasUser: !!data.user,
    hasSettings: !!data.settings,
    exportedAt: data.exportedAt
  }
}

/**
 * 格式化预览信息为人类可读文本
 */
export function formatPreviewText(preview: ImportPreview): string {
  const lines: string[] = []
  lines.push(`备份时间：${preview.exportedAt}`)
  if (preview.accounts) lines.push(`账户：${preview.accounts} 条`)
  if (preview.debts) lines.push(`负债：${preview.debts} 条`)
  if (preview.transactions) lines.push(`交易：${preview.transactions} 条`)
  if (preview.goals) lines.push(`目标：${preview.goals} 条`)
  if (preview.hasUser) lines.push('包含：用户信息')
  if (preview.hasSettings) lines.push('包含：系统设置')
  return lines.join('\n')
}

export interface FullBackupData {
  version: string
  exportedAt: string
  user?: any
  accounts?: any[]
  debts?: any[]
  transactions?: any[]
  goals?: any[]
  settings?: any
}

// ==================== JSON 导入 ====================

/**
 * 从 JSON 字符串解析备份数据
 */
export function parseJsonBackup(jsonString: string): FullBackupData | null {
  try {
    const data = JSON.parse(jsonString)
    if (!data.version || !data.exportedAt) {
      throw new Error('无效的备份文件格式')
    }
    return data as FullBackupData
  } catch (error: any) {
    ElMessage.error(`JSON 解析失败: ${error.message}`)
    return null
  }
}

// ==================== Excel 导入 ====================

/**
 * 从 Excel 文件解析数据
 * 期望工作表名称: accounts, debts, transactions, goals
 */
export function parseExcelBackup(file: File): Promise<FullBackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        const result: FullBackupData = {
          version: '1.0',
          exportedAt: new Date().toISOString()
        }

        // 解析各工作表
        if (workbook.SheetNames.includes('accounts')) {
          result.accounts = XLSX.utils.sheet_to_json(workbook.Sheets['accounts'])
        }
        if (workbook.SheetNames.includes('debts')) {
          result.debts = XLSX.utils.sheet_to_json(workbook.Sheets['debts'])
        }
        if (workbook.SheetNames.includes('transactions')) {
          result.transactions = XLSX.utils.sheet_to_json(workbook.Sheets['transactions'])
        }
        if (workbook.SheetNames.includes('goals')) {
          result.goals = XLSX.utils.sheet_to_json(workbook.Sheets['goals'])
        }

        resolve(result)
      } catch (error: any) {
        reject(new Error(`Excel 解析失败: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// ==================== 文件选择 ====================

/**
 * 弹出文件选择对话框，读取文件内容
 */
export function pickFile(accept: string = '.json,.xlsx,.xls'): Promise<{ file: File; content: FullBackupData }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    document.body.appendChild(input)

    input.onchange = async () => {
      const file = input.files?.[0]
      document.body.removeChild(input)

      if (!file) {
        reject(new Error('未选择文件'))
        return
      }

      try {
        let content: FullBackupData

        if (file.name.endsWith('.json')) {
          const text = await file.text()
          content = parseJsonBackup(text) as FullBackupData
          if (!content) throw new Error('JSON 解析失败')
        } else if (file.name.match(/\.xlsx?$/)) {
          content = await parseExcelBackup(file)
        } else {
          throw new Error('不支持的文件格式，请选择 .json 或 .xlsx 文件')
        }

        resolve({ file, content })
      } catch (error: any) {
        reject(error)
      }
    }

    input.click()
  })
}

// ==================== 全量备份导出 (JSON) ====================

/**
 * 导出全量备份为 JSON 文件
 * @param data 所有数据
 */
export function exportFullBackup(data: FullBackupData): void {
  try {
    const timestamp = new Date().toISOString().slice(0, 10)
    const fullFilename = `wealth-freedom-backup_${timestamp}.json`

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fullFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    ElMessage.success('备份文件导出成功')
  } catch (error) {
    console.error('备份导出失败:', error)
    ElMessage.error('备份导出失败')
  }
}
