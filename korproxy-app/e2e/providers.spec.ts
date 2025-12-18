import { test, expect } from '@playwright/test'

test.describe('Providers Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('korproxy-onboarding-storage', JSON.stringify({
        state: { completed: true, currentStep: 6, selectedProviders: [], selectedTools: [] },
      }))
    })
    await page.goto('/providers')
    await page.waitForLoadState('networkidle')
  })

  test('should display providers page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Providers' })).toBeVisible()
    await expect(page.getByText('Connect and manage your AI provider accounts')).toBeVisible()
  })

  test('should display all provider cards', async ({ page }) => {
    await expect(page.getByText('Google Gemini')).toBeVisible()
    await expect(page.getByText('Anthropic Claude')).toBeVisible()
    await expect(page.getByText('OpenAI')).toBeVisible()
    await expect(page.getByText('Qwen')).toBeVisible()
    await expect(page.getByText('iFlow')).toBeVisible()
  })

  test('should show connect buttons for disconnected providers', async ({ page }) => {
    const connectButtons = page.getByRole('button', { name: 'Connect' })
    await expect(connectButtons.first()).toBeVisible()
  })

  test('should open OAuth modal when clicking connect', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect' }).first()
    await connectButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Sign in to link your')).toBeVisible()
  })

  test('should close OAuth modal when clicking close button', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect' }).first()
    await connectButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should show provider status indicators', async ({ page }) => {
    await expect(page.getByText('Connected').or(page.getByText('Disconnected'))).toBeVisible()
  })
})
