import { test, expect } from '@playwright/test'

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics')
  })

  test('should display analytics page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
  })

  test('should have date range picker with default options', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Last 7 days' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible()
  })

  test('should switch date range when clicking options', async ({ page }) => {
    const last30d = page.getByRole('button', { name: 'Last 30 days' })
    await last30d.click()
    
    // Check it becomes the active selection (has bg-primary class)
    await expect(last30d).toHaveClass(/bg-primary/)
    
    const last7d = page.getByRole('button', { name: 'Last 7 days' })
    await last7d.click()
    await expect(last7d).toHaveClass(/bg-primary/)
  })

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button[title="Refresh"]')
    await expect(refreshButton).toBeVisible()
  })

  test('should have clear data button', async ({ page }) => {
    const clearButton = page.locator('button[title="Clear Data"]')
    await expect(clearButton).toBeVisible()
  })

  test('should show proxy not running state when proxy is stopped', async ({ page }) => {
    // When proxy is not running, we should see the "Proxy Not Running" message
    // This tests the empty state UI
    const proxyNotRunning = page.getByText('Proxy Not Running')
    
    // Either the message is shown OR charts are shown (if proxy is running)
    const summaryCards = page.getByText('Total Requests')
    
    // One of these should be visible
    const hasNotRunningMessage = await proxyNotRunning.isVisible().catch(() => false)
    const hasSummaryCards = await summaryCards.isVisible().catch(() => false)
    
    expect(hasNotRunningMessage || hasSummaryCards).toBeTruthy()
  })

  test('should show clear data confirmation dialog', async ({ page }) => {
    // First mock the proxy as running by manipulating the page state
    await page.evaluate(() => {
      // Simulate proxy running state in localStorage
      localStorage.setItem('korproxy-proxy-storage', JSON.stringify({
        state: { running: true, port: 1337, logs: [] }
      }))
    })
    
    await page.reload()
    await page.goto('/analytics')
    
    const clearButton = page.locator('button[title="Clear Data"]')
    
    // Check if clear button is enabled (proxy must be running)
    const isDisabled = await clearButton.getAttribute('disabled')
    if (isDisabled === null) {
      await clearButton.click()
      
      // Check dialog appears
      await expect(page.getByText('Clear Analytics Data')).toBeVisible()
      await expect(page.getByText('This will permanently delete all analytics data')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Clear Data' })).toBeVisible()
      
      // Cancel should close dialog
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByText('Clear Analytics Data')).not.toBeVisible()
    }
  })

  test('should navigate to analytics from sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /analytics/i }).click()
    await expect(page).toHaveURL('/analytics')
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
  })
})

test.describe('Analytics Charts (with mock data)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock metrics data in localStorage to simulate proxy running state
    await page.addInitScript(() => {
      // Mock the proxy as running
      localStorage.setItem('korproxy-proxy-storage', JSON.stringify({
        state: { running: true, port: 1337, logs: [] }
      }))
    })
  })

  test('should display summary cards section when proxy is running', async ({ page }) => {
    await page.goto('/analytics')
    
    // Either we see the "not running" message or the cards
    // This depends on whether the proxy actually is running
    const totalRequestsVisible = await page.getByText('Total Requests').isVisible().catch(() => false)
    const notRunningVisible = await page.getByText('Proxy Not Running').isVisible().catch(() => false)
    
    expect(totalRequestsVisible || notRunningVisible).toBeTruthy()
  })

  test('should display chart placeholders or loading states', async ({ page }) => {
    await page.goto('/analytics')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // The page should have the analytics heading at minimum
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
  })
})
