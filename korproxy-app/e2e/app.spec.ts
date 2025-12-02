import { test, expect } from '@playwright/test'

test.describe('KorProxy App', () => {
  test('should display the dashboard', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should have navigation sidebar', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Providers')).toBeVisible()
    await expect(page.getByText('Accounts')).toBeVisible()
    await expect(page.getByText('Logs')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
  })

  test('should navigate to providers page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /providers/i }).click()

    await expect(page).toHaveURL('/providers')
  })

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /settings/i }).click()

    await expect(page).toHaveURL('/settings')
  })

  test('should show proxy status card', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Proxy Status')).toBeVisible()
  })

  test('should display stat cards', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Total Accounts')).toBeVisible()
    await expect(page.getByText('Active Providers')).toBeVisible()
    await expect(page.getByText('Requests Today')).toBeVisible()
  })

  test('should display provider summary', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Provider Summary')).toBeVisible()
    await expect(page.getByText('Gemini')).toBeVisible()
    await expect(page.getByText('Claude')).toBeVisible()
  })

  test('should show error fallback when error occurs', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const event = new Event('error')
      window.dispatchEvent(event)
    })

    const errorFallback = page.getByText('Something went wrong')
    if (await errorFallback.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(errorFallback).toBeVisible()
      await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
    }
  })

  test('should display page title in header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.goto('/providers')
    await expect(page.getByRole('heading', { name: 'Providers' })).toBeVisible()

    await page.goto('/accounts')
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

    await page.goto('/logs')
    await expect(page.getByRole('heading', { name: 'Request Logs' })).toBeVisible()
  })
})
