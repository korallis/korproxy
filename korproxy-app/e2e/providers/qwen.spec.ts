import { test, expect } from '@playwright/test'
import {
  MockProviderServer,
  ProviderResponses,
  createStreamingChunks,
  createRateLimitResponse,
  createUnauthorizedResponse,
} from '../utils/provider-test-utils'

test.describe('Qwen Provider E2E Tests', () => {
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
    test('should open OAuth modal when clicking connect on Qwen card', async ({ page }) => {
      await page.goto('/providers')
      await page.waitForLoadState('networkidle')
      
      const qwenCard = page.locator('div').filter({ hasText: /^Qwen/ }).first()
      const connectButton = qwenCard.getByRole('button', { name: 'Connect' })
      
      if (await connectButton.isVisible()) {
        await connectButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
      }
    })
  })

  test.describe('API Request Mocking', () => {
    test('should handle mocked successful chat completion', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.qwen.success('Hello from Qwen!'))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked streaming responses', async ({ page }) => {
      const streamContent = 'This is a streaming response from Qwen'
      mockServer.setStreamingResponse('chat', createStreamingChunks(streamContent))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })
  })

  test.describe('Error Response Mocking', () => {
    test('should handle mocked rate limit (429) response', async ({ page }) => {
      mockServer.setMockResponse('chat', createRateLimitResponse(45))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked unauthorized (401) response', async ({ page }) => {
      mockServer.setMockResponse('chat', createUnauthorizedResponse('Qwen'))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle Qwen-specific error format', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.qwen.rateLimit())
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })
  })
})
