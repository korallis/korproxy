import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display settings page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('should have all settings tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Proxy' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Config' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'About' })).toBeVisible()
  })

  test('should show appearance settings in General tab', async ({ page }) => {
    await expect(page.getByText('Appearance')).toBeVisible()
    await expect(page.getByText('Theme')).toBeVisible()
  })

  test('should switch to Proxy tab and show settings', async ({ page }) => {
    await page.getByRole('tab', { name: 'Proxy' }).click()

    await expect(page.getByText('Proxy Configuration')).toBeVisible()
    await expect(page.getByText('Proxy Status')).toBeVisible()
    await expect(page.getByText('Proxy Port')).toBeVisible()
    await expect(page.getByText('Auto-start proxy')).toBeVisible()
  })

  test('should switch to Config tab and show editor', async ({ page }) => {
    await page.getByRole('tab', { name: 'Config' }).click()

    await expect(page.getByText('Configuration File')).toBeVisible()
    await expect(page.getByText('Edit the proxy server YAML configuration')).toBeVisible()
  })

  test('should switch to About tab and show version info', async ({ page }) => {
    await page.getByRole('tab', { name: 'About' }).click()

    await expect(page.getByText('About KorProxy')).toBeVisible()
    await expect(page.getByText('Version')).toBeVisible()
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible()
  })

  test('should have theme toggle buttons', async ({ page }) => {
    const lightButton = page.locator('button').filter({ has: page.locator('svg.lucide-sun') })
    const darkButton = page.locator('button').filter({ has: page.locator('svg.lucide-moon') })

    await expect(lightButton.or(darkButton)).toBeVisible()
  })

  test('should have minimize to tray toggle', async ({ page }) => {
    await expect(page.getByText('Minimize to tray')).toBeVisible()
    await expect(page.getByRole('switch')).toBeVisible()
  })

  test('should toggle theme when clicking theme buttons', async ({ page }) => {
    const darkButton = page.locator('button').filter({ has: page.locator('svg.lucide-moon') })
    const lightButton = page.locator('button').filter({ has: page.locator('svg.lucide-sun') })

    await lightButton.click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await darkButton.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('should persist theme after navigation', async ({ page }) => {
    const lightButton = page.locator('button').filter({ has: page.locator('svg.lucide-sun') })
    await lightButton.click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/light/)

    await page.goto('/settings')
    await expect(page.locator('html')).toHaveClass(/light/)
  })
})
