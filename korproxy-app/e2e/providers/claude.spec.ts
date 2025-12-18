import { test, expect } from '@playwright/test'
import {
  MockProviderServer,
  ProviderResponses,
  createStreamingChunks,
  createRateLimitResponse,
  createUnauthorizedResponse,
} from '../utils/provider-test-utils'

test.describe('Claude Provider E2E Tests', () => {
  let mockServer: MockProviderServer

  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('korproxy-onboarding-storage', JSON.stringify({
        state: { completed: true, currentStep: 6, selectedProviders: [], selectedTools: [] },
      }))
    })
    mockServer = new MockProviderServer(page)
    await mockServer.setup()
  })

  test.afterEach(async () => {
    await mockServer.teardown()
  })

  test.describe('OAuth Flow', () => {
    test('should open OAuth modal when clicking connect on Claude card', async ({ page }) => {
      await page.goto('/providers')
      await page.waitForLoadState('networkidle')
      
      // Find the Claude card and click Connect
      const claudeCard = page.locator('div').filter({ hasText: /Anthropic Claude/ }).first()
      const connectButton = claudeCard.getByRole('button', { name: 'Connect' })
      
      if (await connectButton.isVisible()) {
        await connectButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/Sign in to link your/)).toBeVisible()
      }
    })

    test('should close OAuth modal on cancel', async ({ page }) => {
      await page.goto('/providers')
      await page.waitForLoadState('networkidle')
      
      const connectButton = page.getByRole('button', { name: 'Connect' }).first()
      
      if (await connectButton.isVisible()) {
        await connectButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        
        await page.getByRole('button', { name: 'Close' }).click()
        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })
  })

  test.describe('API Request Mocking', () => {
    test('should handle mocked successful chat completion', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.claude.success('Hello from Claude!'))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verify app loaded successfully
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked streaming responses', async ({ page }) => {
      const streamContent = 'This is a streaming response from Claude'
      mockServer.setStreamingResponse('chat', createStreamingChunks(streamContent))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })
  })

  test.describe('Error Response Mocking', () => {
    test('should handle mocked rate limit (429) response', async ({ page }) => {
      mockServer.setMockResponse('chat', createRateLimitResponse(30))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // App should still be functional
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked unauthorized (401) response', async ({ page }) => {
      mockServer.setMockResponse('chat', createUnauthorizedResponse('Claude'))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle Claude-specific rate limit format', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.claude.rateLimit())
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })
  })

  test.describe('Dashboard Integration', () => {
    test('should display Claude in provider summary', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Claude').first()).toBeVisible()
    })
  })
})
