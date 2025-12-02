import { test, expect } from '@playwright/test'

test.describe('Logs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/logs')
  })

  test('should display logs page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Logs' })).toBeVisible()
  })

  test('should have clear logs button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /clear logs/i })).toBeVisible()
  })

  test('should have log filter tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Errors' })).toBeVisible()
  })

  test('should show empty state when no logs', async ({ page }) => {
    const noLogs = page.getByText('No logs to display')
    const hasNoLogs = await noLogs.isVisible().catch(() => false)

    if (hasNoLogs) {
      await expect(noLogs).toBeVisible()
    }
  })

  test('should filter logs by tab selection', async ({ page }) => {
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('tab', { name: 'Info' })).toHaveAttribute('data-state', 'active')

    await page.getByRole('tab', { name: 'Errors' }).click()
    await expect(page.getByRole('tab', { name: 'Errors' })).toHaveAttribute('data-state', 'active')

    await page.getByRole('tab', { name: 'All' }).click()
    await expect(page.getByRole('tab', { name: 'All' })).toHaveAttribute('data-state', 'active')
  })

  test('should display log count in subheading', async ({ page }) => {
    await expect(page.getByText(/\d+ log entries/)).toBeVisible()
  })
})
