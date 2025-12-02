import { test, expect } from '@playwright/test'

test.describe('Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accounts')
  })

  test('should display accounts page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  })

  test('should show empty state when no accounts', async ({ page }) => {
    const emptyState = page.getByText('No accounts connected')
    const accountsList = page.locator('[data-testid="accounts-list"]')
    
    const hasAccounts = await accountsList.isVisible().catch(() => false)
    
    if (!hasAccounts) {
      await expect(emptyState).toBeVisible()
      await expect(page.getByText('Connect your AI provider accounts')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Connect Account' })).toBeVisible()
    }
  })

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button').filter({ has: page.locator('svg.lucide-refresh-cw') })
    await expect(refreshButton).toBeVisible()
  })

  test('should navigate to providers when clicking connect', async ({ page }) => {
    const emptyState = page.getByText('No accounts connected')
    
    if (await emptyState.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Connect Account' }).click()
      await expect(page).toHaveURL('/providers')
    }
  })
})
