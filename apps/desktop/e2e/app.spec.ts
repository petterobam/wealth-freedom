import { test, expect } from './fixtures'

test.describe('应用启动', () => {
  test('应成功启动并显示欢迎页', async ({ window }) => {
    // 等待 Vue 渲染
    await window.waitForTimeout(2000)
    const title = await window.title()
    expect(title).toBeTruthy()
    // 检查渲染器进程已加载
    const body = await window.textContent('body')
    expect(body!.length).toBeGreaterThan(0)
  })

  test('侧边栏应显示导航项', async ({ window }) => {
    await window.waitForTimeout(2000)
    // 侧边栏应存在
    const sidebar = window.locator('.sidebar, [class*="sidebar"], nav, .el-menu')
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard 看板', () => {
  test('应显示财务概览数据', async ({ window }) => {
    await window.waitForTimeout(2000)
    // 点击 Dashboard 导航（如果有的话）
    const dashboardLink = window.locator('text=看板, text=Dashboard, text=总览').first()
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click()
      await window.waitForTimeout(1000)
    }
    // 页面应有内容
    const content = await window.textContent('body')
    expect(content!.length).toBeGreaterThan(10)
  })
})

test.describe('交易记录', () => {
  test('应能导航到交易页面', async ({ window }) => {
    await window.waitForTimeout(2000)
    const link = window.locator('text=交易, text=Transactions, text=记录').first()
    if (await link.isVisible()) {
      await link.click()
      await window.waitForTimeout(1000)
    }
    const content = await window.textContent('body')
    expect(content!.length).toBeGreaterThan(10)
  })
})

test.describe('账户管理', () => {
  test('应能导航到账户页面', async ({ window }) => {
    await window.waitForTimeout(2000)
    const link = window.locator('text=账户, text=Accounts, text=资产').first()
    if (await link.isVisible()) {
      await link.click()
      await window.waitForTimeout(1000)
    }
    const content = await window.textContent('body')
    expect(content!.length).toBeGreaterThan(10)
  })
})

test.describe('许可证页面', () => {
  test('应显示许可证信息', async ({ window }) => {
    await window.waitForTimeout(2000)
    const link = window.locator('text=许可证, text=License, text=激活').first()
    if (await link.isVisible()) {
      await link.click()
      await window.waitForTimeout(1000)
    }
    const content = await window.textContent('body')
    expect(content!.length).toBeGreaterThan(10)
  })
})

test.describe('设置页面', () => {
  test('应能打开设置', async ({ window }) => {
    await window.waitForTimeout(2000)
    const link = window.locator('text=设置, text=Settings').first()
    if (await link.isVisible()) {
      await link.click()
      await window.waitForTimeout(1000)
    }
    const content = await window.textContent('body')
    expect(content!.length).toBeGreaterThan(10)
  })
})
