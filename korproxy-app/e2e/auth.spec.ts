import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show sign in button when not logged in', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeVisible()
  })

  test('should open auth modal when clicking sign in', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await signInButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Welcome Back')).toBeVisible()
  })

  test('should have email and password fields in auth modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  })

  test('should show validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()

    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Sign In', exact: true })
    await submitButton.click()

    await expect(page.getByText('Please fill in all required fields')).toBeVisible()
  })

  test('should switch between login and register modes', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Welcome Back')).toBeVisible()
    await page.getByRole('button', { name: 'Sign up' }).click()
    
    await expect(page.getByText('Create Account')).toBeVisible()
    await expect(page.getByPlaceholder('John Doe')).toBeVisible()
    await expect(page.getByPlaceholder('Min 8 characters')).toBeVisible()

    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Welcome Back')).toBeVisible()
  })

  test('should close auth modal when clicking close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('dialog').locator('button').filter({ has: page.locator('svg.lucide-x') }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should show password length validation in register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.getByRole('button', { name: 'Sign up' }).click()

    await page.getByPlaceholder('you@example.com').fill('test@example.com')
    await page.getByPlaceholder('Min 8 characters').fill('short')

    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Create Account' })
    await submitButton.click()

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })
})
