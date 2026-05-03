/**
 * 全局错误处理 Composable
 * 统一错误分类、提示、恢复策略
 */

import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from '@/i18n'

export type ErrorCategory = 'network' | 'storage' | 'permission' | 'validation' | 'unknown'

export interface AppError {
  category: ErrorCategory
  message: string
  detail?: string
  recoverable: boolean
  action?: () => Promise<void>
}

/**
 * 从原始错误中分类并提取可读信息
 */
function classifyError(error: unknown): AppError {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()

  // 网络/IPC 错误
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout') || lower.includes('econnrefused') || lower.includes('ipc')) {
    return {
      category: 'network',
      message: useI18n ? '网络连接异常，请检查网络设置' : msg,
      detail: msg,
      recoverable: true
    }
  }

  // 存储/数据库错误
  if (lower.includes('sqlite') || lower.includes('database') || lower.includes('disk') || lower.includes('storage') || lower.includes('enoent') || lower.includes('readonly')) {
    return {
      category: 'storage',
      message: '数据存储异常，请检查磁盘空间',
      detail: msg,
      recoverable: true
    }
  }

  // 权限错误
  if (lower.includes('permission') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('access denied')) {
    return {
      category: 'permission',
      message: '权限不足，请检查许可证状态',
      detail: msg,
      recoverable: true
    }
  }

  // 验证错误
  if (lower.includes('validation') || lower.includes('required') || lower.includes('invalid')) {
    return {
      category: 'validation',
      message: msg,
      recoverable: true
    }
  }

  return {
    category: 'unknown',
    message: msg || '操作失败，请稍后重试',
    detail: msg,
    recoverable: true
  }
}

export function useErrorHandler() {
  const { t } = useI18n()

  const categoryIcons: Record<ErrorCategory, string> = {
    network: '🌐',
    storage: '💾',
    permission: '🔒',
    validation: '⚠️',
    unknown: '❌'
  }

  /**
   * 轻量错误提示（toast）
   */
  function showError(error: unknown, duration = 3000) {
    const appError = classifyError(error)
    ElMessage({
      message: appError.message,
      type: 'error',
      duration,
      showClose: true
    })
    console.error(`[${appError.category}]`, appError.detail || error)
  }

  /**
   * 带恢复操作的错误提示
   */
  async function showErrorWithRecovery(error: unknown, recoverAction?: () => Promise<void>) {
    const appError = classifyError(error)
    try {
      await ElMessageBox.alert(
        appError.detail || appError.message,
        `${categoryIcons[appError.category]} ${appError.message}`,
        {
          confirmButtonText: recoverAction ? '重试' : '确定',
          showCancelButton: !!recoverAction,
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      if (recoverAction) {
        await recoverAction()
      }
    } catch {
      // 用户取消
    }
  }

  /**
   * 安全执行异步操作，自动处理错误
   */
  async function safeCall<T>(
    fn: () => Promise<T>,
    options?: {
      successMsg?: string
      errorDuration?: number
      onError?: (error: AppError) => void
    }
  ): Promise<T | null> {
    try {
      const result = await fn()
      if (options?.successMsg) {
        ElMessage.success(options.successMsg)
      }
      return result
    } catch (error) {
      const appError = classifyError(error)
      showError(error, options?.errorDuration)
      options?.onError?.(appError)
      return null
    }
  }

  /**
   * 全局未捕获错误处理（注册在 App 级别）
   */
  function setupGlobalHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault()
      const appError = classifyError(event.reason)
      console.error('[Global Unhandled Rejection]', appError)
      // 不弹窗打扰用户，只记录
    })

    window.addEventListener('error', (event) => {
      const appError = classifyError(event.error || event.message)
      console.error('[Global Error]', appError)
    })
  }

  return {
    showError,
    showErrorWithRecovery,
    safeCall,
    setupGlobalHandlers,
    classifyError
  }
}
