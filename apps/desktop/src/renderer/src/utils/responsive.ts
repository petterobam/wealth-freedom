/**
 * 响应式断点系统
 * 基于 Bootstrap 断点标准
 */

// 断点定义（单位：px）
export const BREAKPOINTS = {
  xs: 0,      // 超小屏幕（手机竖屏）
  sm: 576,    // 小屏幕（手机横屏）
  md: 768,    // 中等屏幕（平板）
  lg: 992,    // 大屏幕（桌面）
  xl: 1200,   // 超大屏幕（大桌面）
  xxl: 1400   // 超超大屏幕（超大桌面）
} as const

// 断点类型
export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * 获取当前屏幕尺寸对应的断点
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth

  if (width < BREAKPOINTS.sm) return 'xs'
  if (width < BREAKPOINTS.md) return 'sm'
  if (width < BREAKPOINTS.lg) return 'md'
  if (width < BREAKPOINTS.xl) return 'lg'
  if (width < BREAKPOINTS.xxl) return 'xl'
  return 'xxl'
}

/**
 * 判断当前是否为移动端屏幕（xs 或 sm）
 */
export function isMobile(): boolean {
  const breakpoint = getCurrentBreakpoint()
  return breakpoint === 'xs' || breakpoint === 'sm'
}

/**
 * 判断当前是否为平板屏幕（md）
 */
export function isTablet(): boolean {
  return getCurrentBreakpoint() === 'md'
}

/**
 * 判断当前是否为桌面屏幕（lg 及以上）
 */
export function isDesktop(): boolean {
  const breakpoint = getCurrentBreakpoint()
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl'
}

/**
 * 获取网格列数
 * @param totalColumns 总列数
 * @param breakpoint 当前断点
 * @returns 对应断点的列数
 */
export function getGridColumns(totalColumns: number, breakpoint: Breakpoint): number {
  const columnsMap: Record<Breakpoint, number> = {
    xs: Math.min(totalColumns, 1),   // 移动端：1 列
    sm: Math.min(totalColumns, 2),   // 小屏：2 列
    md: Math.min(totalColumns, 3),   // 平板：3 列
    lg: totalColumns,                 // 桌面：全部列数
    xl: totalColumns,
    xxl: totalColumns
  }

  return columnsMap[breakpoint]
}

/**
 * 获取卡片网格的列数
 * @param totalColumns 总列数
 * @returns grid-template-columns 值
 */
export function getCardGridColumns(totalColumns: number): string {
  const breakpoint = getCurrentBreakpoint()
  const columns = getGridColumns(totalColumns, breakpoint)
  return `repeat(${columns}, 1fr)`
}

/**
 * 获取侧边栏宽度
 * @returns 侧边栏宽度（px）
 */
export function getSidebarWidth(): number {
  const breakpoint = getCurrentBreakpoint()

  const widthMap: Record<Breakpoint, number> = {
    xs: 0,      // 移动端：隐藏
    sm: 200,    // 小屏：200px
    md: 220,    // 平板：220px
    lg: 240,    // 桌面：240px
    xl: 260,    // 大屏：260px
    xxl: 260    // 超大屏：260px
  }

  return widthMap[breakpoint]
}

/**
 * 获取主内容区 padding
 * @returns padding 值
 */
export function getMainPadding(): string {
  const breakpoint = getCurrentBreakpoint()

  const paddingMap: Record<Breakpoint, string> = {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '20px',
    xl: '24px',
    xxl: '24px'
  }

  return paddingMap[breakpoint]
}

/**
 * 获取图表高度
 * @param defaultHeight 默认高度
 * @returns 图表高度
 */
export function getChartHeight(defaultHeight: number = 350): number {
  const breakpoint = getCurrentBreakpoint()

  const heightMap: Record<Breakpoint, number> = {
    xs: defaultHeight * 0.7,
    sm: defaultHeight * 0.8,
    md: defaultHeight * 0.9,
    lg: defaultHeight,
    xl: defaultHeight,
    xxl: defaultHeight
  }

  return heightMap[breakpoint]
}

/**
 * 获取表单 label 宽度
 * @returns label 宽度
 */
export function getFormLabelWidth(): string {
  const breakpoint = getCurrentBreakpoint()

  const widthMap: Record<Breakpoint, string> = {
    xs: 'auto',     // 移动端：自适应（堆叠布局）
    sm: '80px',     // 小屏：80px
    md: '100px',    // 平板：100px
    lg: '120px',    // 桌面：120px
    xl: '120px',    // 大屏：120px
    xxl: '120px'    // 超大屏：120px
  }

  return widthMap[breakpoint]
}

/**
 * 监听窗口大小变化
 * @param callback 回调函数
 * @returns 清理函数
 */
export function onWindowResize(callback: () => void): () => void {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}
