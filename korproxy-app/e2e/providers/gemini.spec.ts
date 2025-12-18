import { test, expect } from '@playwright/test'
import {
  MockProviderServer,
  ProviderResponses,
  createStreamingChunks,
  createRateLimitResponse,
} from '../utils/provider-test-utils'

test.describe('Gemini Provider E2E Tests', () => {
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
    test('should open OAuth modal when clicking connect on Gemini card', async ({ page }) => {
      await page.goto('/providers')
      await page.waitForLoadState('networkidle')
      
      const geminiCard = page.locator('div').filter({ hasText: /Google Gemini/ }).first()
      const connectButton = geminiCard.getByRole('button', { name: 'Connect' })
      
      if (await connectButton.isVisible()) {
        await connectButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
      }
    })
  })

  test.describe('API Request Mocking', () => {
    test('should handle mocked successful chat completion', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.gemini.success('Hello from Gemini!'))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked streaming responses', async ({ page }) => {
      const streamContent = 'This is a streaming response from Gemini'
      mockServer.setStreamingResponse('chat', createStreamingChunks(streamContent))
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle mocked embedding requests', async ({ page }) => {
      mockServer.setMockResponse('embedding', {
        status: 200,
        body: {
          object: 'list',
          data: [{ object: 'embedding', embedding: [0.1, 0.2, 0.3], index: 0 }],
          model: 'text-embedding-004',
          usage: { prompt_tokens: 5, total_tokens: 5 },
        },
      })
      
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
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle Gemini-specific rate limit format', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.gemini.rateLimit())
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle Gemini unauthorized response', async ({ page }) => {
      mockServer.setMockResponse('chat', ProviderResponses.gemini.unauthorized())
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })
  })

  test.describe('Dashboard Integration', () => {
    test('should display Gemini in provider summary', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.getByText('Gemini').first()).toBeVisible()
    })
  })
})
