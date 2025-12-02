import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { join } from 'path'

let electronApp: ElectronApplication
let window: Page

test.describe('Electron App Smoke Tests', () => {
  test.beforeAll(async () => {
    const appPath = join(__dirname, '..')
    
    electronApp = await electron.launch({
      args: [join(appPath, 'dist-electron/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    window = await electronApp.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close()
    }
  })

  test('should launch the application', async () => {
    const isVisible = await window.isVisible('body')
    expect(isVisible).toBe(true)
  })

  test('should display the app title in window', async () => {
    const title = await window.title()
    expect(title).toContain('KorProxy')
  })

  test('should render the sidebar navigation', async () => {
    await expect(window.locator('text=Dashboard')).toBeVisible()
    await expect(window.locator('text=Providers')).toBeVisible()
    await expect(window.locator('text=Accounts')).toBeVisible()
    await expect(window.locator('text=Logs')).toBeVisible()
    await expect(window.locator('text=Settings')).toBeVisible()
  })

  test('should display proxy status indicator', async () => {
    await expect(window.locator('text=Running').or(window.locator('text=Stopped'))).toBeVisible()
  })

  test('should navigate between pages', async () => {
    await window.click('text=Providers')
    await expect(window.locator('h1:has-text("Providers")')).toBeVisible()

    await window.click('text=Settings')
    await expect(window.locator('h1:has-text("Settings")')).toBeVisible()

    await window.click('text=Dashboard')
    await expect(window.locator('h1:has-text("Dashboard")')).toBeVisible()
  })

  test('should have window controls working', async () => {
    const browserWindow = await electronApp.browserWindow(window)
    
    const isMaximized = await browserWindow.evaluate((win) => win.isMaximized())
    expect(typeof isMaximized).toBe('boolean')
    
    const isMinimized = await browserWindow.evaluate((win) => win.isMinimized())
    expect(isMinimized).toBe(false)
  })

  test('should expose korproxy API on window', async () => {
    const hasKorproxy = await window.evaluate(() => {
      return typeof (window as unknown as { korproxy?: unknown }).korproxy === 'object'
    })
    expect(hasKorproxy).toBe(true)
  })

  test('should have IPC proxy methods available', async () => {
    const hasProxyMethods = await window.evaluate(() => {
      const korproxy = (window as unknown as { korproxy?: { proxy?: { start?: unknown; stop?: unknown; getStatus?: unknown } } }).korproxy
      return (
        typeof korproxy?.proxy?.start === 'function' &&
        typeof korproxy?.proxy?.stop === 'function' &&
        typeof korproxy?.proxy?.getStatus === 'function'
      )
    })
    expect(hasProxyMethods).toBe(true)
  })

  test('should be able to get proxy status via IPC', async () => {
    const status = await window.evaluate(async () => {
      const korproxy = (window as unknown as { korproxy?: { proxy?: { getStatus?: () => Promise<{ running: boolean; port: number }> } } }).korproxy
      return korproxy?.proxy?.getStatus?.()
    })
    
    expect(status).toHaveProperty('running')
    expect(status).toHaveProperty('port')
    expect(typeof status?.running).toBe('boolean')
    expect(typeof status?.port).toBe('number')
  })
})
