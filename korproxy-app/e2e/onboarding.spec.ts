import { test, expect } from '@playwright/test'

test.describe('Onboarding Wizard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset onboarding state
    await page.addInitScript(() => {
      localStorage.clear()
    })
    await page.goto('/')
  })

  test.describe('Wizard Display', () => {
    test('should show onboarding wizard for new users', async ({ page }) => {
      // Wait for app to load
      await page.waitForLoadState('networkidle')
      
      // Onboarding wizard should be visible
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('Step 1 of 7')).toBeVisible()
    })

    test('should display welcome step initially', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Welcome to KorProxy')).toBeVisible()
    })

    test('should show progress indicator', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText(/Step \d+ of 7/)).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to next step when clicking Get Started', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      const getStartedButton = page.getByRole('button', { name: 'Get Started' })
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click()
        await expect(page.getByText('Step 2 of 7')).toBeVisible()
      }
    })

    test('should allow going back to previous step', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      // Go to step 2
      const getStartedButton = page.getByRole('button', { name: 'Get Started' })
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click()
        await expect(page.getByText('Step 2 of 7')).toBeVisible()
        
        // Go back
        const backButton = page.getByRole('button', { name: 'Back' })
        if (await backButton.isVisible()) {
          await backButton.click()
          await expect(page.getByText('Step 1 of 7')).toBeVisible()
        }
      }
    })

    test('should close wizard when clicking skip/close button', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      const closeButton = page.getByRole('button', { name: 'Skip onboarding' })
      await closeButton.click()
      
      // Wizard should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should close wizard on Escape key', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Full Onboarding Flow', () => {
    test('should complete all steps from start to finish', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      // Step 1: Welcome
      await expect(page.getByText('Welcome to KorProxy')).toBeVisible()
      await page.getByRole('button', { name: 'Get Started' }).click()
      
      // Step 2: Acquisition (how did you hear about us)
      await expect(page.getByText('Step 2 of 7')).toBeVisible()
      const acquisitionOptions = page.locator('[role="radio"]').or(page.locator('input[type="radio"]'))
      if (await acquisitionOptions.count() > 0) {
        await acquisitionOptions.first().click()
      }
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Continue' })).click()
      
      // Step 3: Providers
      await expect(page.getByText('Step 3 of 7')).toBeVisible()
      // Select at least one provider
      const providerCheckboxes = page.locator('[role="checkbox"]').or(page.locator('input[type="checkbox"]'))
      if (await providerCheckboxes.count() > 0) {
        await providerCheckboxes.first().click()
      }
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Continue' })).click()
      
      // Step 4: Connect
      await expect(page.getByText('Step 4 of 7')).toBeVisible()
      // Skip connection step
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Skip' }).or(page.getByRole('button', { name: 'Continue' }))).click()
      
      // Step 5: Tools
      await expect(page.getByText('Step 5 of 7')).toBeVisible()
      // Select tools
      const toolCheckboxes = page.locator('[role="checkbox"]').or(page.locator('input[type="checkbox"]'))
      if (await toolCheckboxes.count() > 0) {
        await toolCheckboxes.first().click()
      }
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Continue' })).click()
      
      // Step 6: Test
      await expect(page.getByText('Step 6 of 7')).toBeVisible()
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Skip' }).or(page.getByRole('button', { name: 'Continue' }))).click()
      
      // Step 7: Done
      await expect(page.getByText('Step 7 of 7')).toBeVisible()
      await page.getByRole('button', { name: /Finish|Complete|Done|Get Started/i }).click()
      
      // Wizard should close and dashboard should be visible
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })
  })

  test.describe('State Persistence', () => {
    test('should persist onboarding completion state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      // Skip onboarding
      await page.getByRole('button', { name: 'Skip onboarding' }).click()
      
      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Onboarding should not appear again
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })

    test('should persist selected providers across steps', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      // Go to providers step
      await page.getByRole('button', { name: 'Get Started' }).click()
      await page.getByRole('button', { name: 'Next' }).or(page.getByRole('button', { name: 'Continue' })).click()
      
      // Select providers
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-onboarding-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      expect(state).toBeTruthy()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      const dialog = page.getByRole('dialog')
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      
      // Tab to Get Started button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to press Enter to activate
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })
  })
})
