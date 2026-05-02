import { test as base, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'

type AppFixture = {
  app: ElectronApplication
  window: Page
}

export const test = base.extend<AppFixture>({
  app: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../out/main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' }
    })
    await use(app)
    await app.close()
  },
  window: async ({ app }, use) => {
    const window = await app.firstWindow()
    await window.waitForLoadState('domcontentloaded')
    await use(window)
  }
})

export const expect = test.expect
