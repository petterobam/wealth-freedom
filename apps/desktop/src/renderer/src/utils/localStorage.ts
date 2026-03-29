/**
 * 本地存储工具
 * 用于保存和加载用户输入的场景数据
 */

/**
 * 保存场景数据到 localStorage
 */
export function saveScenario(toolName: string, scenarioName: string, data: any): boolean {
  try {
    // 获取所有场景
    const allScenarios = getScenarios(toolName)

    // 保存或更新场景
    allScenarios[scenarioName] = {
      name: scenarioName,
      data: data,
      updatedAt: new Date().toISOString()
    }

    // 保存到 localStorage
    const key = `wealth-freedom-${toolName}-scenarios`
    localStorage.setItem(key, JSON.stringify(allScenarios))

    return true
  } catch (error) {
    console.error('保存场景失败:', error)
    return false
  }
}

/**
 * 从 localStorage 加载场景数据
 */
export function loadScenario(toolName: string, scenarioName: string): any | null {
  try {
    const allScenarios = getScenarios(toolName)
    return allScenarios[scenarioName]?.data || null
  } catch (error) {
    console.error('加载场景失败:', error)
    return null
  }
}

/**
 * 获取所有场景
 */
export function getScenarios(toolName: string): Record<string, any> {
  try {
    const key = `wealth-freedom-${toolName}-scenarios`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('获取场景列表失败:', error)
    return {}
  }
}

/**
 * 删除场景
 */
export function deleteScenario(toolName: string, scenarioName: string): boolean {
  try {
    const allScenarios = getScenarios(toolName)

    if (allScenarios[scenarioName]) {
      delete allScenarios[scenarioName]

      const key = `wealth-freedom-${toolName}-scenarios`
      localStorage.setItem(key, JSON.stringify(allScenarios))

      return true
    }

    return false
  } catch (error) {
    console.error('删除场景失败:', error)
    return false
  }
}

/**
 * 自动保存当前场景
 * 在表单数据变化时自动保存
 */
export function autoSaveScene(toolName: string, data: any): void {
  try {
    const key = `wealth-freedom-${toolName}-autosave`
    localStorage.setItem(key, JSON.stringify({
      data: data,
      updatedAt: new Date().toISOString()
    }))
  } catch (error) {
    console.error('自动保存失败:', error)
  }
}

/**
 * 加载自动保存的场景
 */
export function loadAutoSaveScene(toolName: string): any | null {
  try {
    const key = `wealth-freedom-${toolName}-autosave`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data).data : null
  } catch (error) {
    console.error('加载自动保存失败:', error)
    return null
  }
}

/**
 * 清除自动保存的场景
 */
export function clearAutoSaveScene(toolName: string): void {
  try {
    const key = `wealth-freedom-${toolName}-autosave`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('清除自动保存失败:', error)
  }
}
