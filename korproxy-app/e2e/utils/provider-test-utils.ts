import { type Page, type Route } from '@playwright/test'

export interface MockProviderConfig {
  port?: number
  responseDelay?: number
}

export interface StreamChunk {
  content: string
  finish_reason?: string
}

export interface MockResponse {
  status?: number
  body?: object | string
  headers?: Record<string, string>
  delay?: number
}

/**
 * MockProviderServer - Simulates AI provider responses for offline testing
 * Uses Playwright's route interception to mock API responses
 */
export class MockProviderServer {
  private page: Page
  private routes: Map<string, MockResponse> = new Map()
  private streamingRoutes: Map<string, StreamChunk[]> = new Map()

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Intercept requests to the proxy endpoint and return mock responses
   */
  async setup(): Promise<void> {
    await this.page.route('**/v1/chat/completions', async (route) => {
      await this.handleRoute(route, 'chat')
    })

    await this.page.route('**/v1/completions', async (route) => {
      await this.handleRoute(route, 'completion')
    })

    await this.page.route('**/v1/embeddings', async (route) => {
      await this.handleRoute(route, 'embedding')
    })
  }

  private async handleRoute(route: Route, type: string): Promise<void> {
    const mockResponse = this.routes.get(type)
    const streamChunks = this.streamingRoutes.get(type)

    if (mockResponse?.delay) {
      await new Promise((r) => setTimeout(r, mockResponse.delay))
    }

    if (streamChunks) {
      await this.handleStreamingResponse(route, streamChunks)
      return
    }

    if (mockResponse) {
      await route.fulfill({
        status: mockResponse.status ?? 200,
        contentType: 'application/json',
        body: typeof mockResponse.body === 'string' 
          ? mockResponse.body 
          : JSON.stringify(mockResponse.body ?? {}),
        headers: mockResponse.headers,
      })
      return
    }

    // Default success response
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-response-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'mock-model',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Mock response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    })
  }

  private async handleStreamingResponse(route: Route, chunks: StreamChunk[]): Promise<void> {
    const sseChunks = chunks.map((chunk) =>
      `data: ${JSON.stringify({
        id: 'mock-stream-id',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'mock-model',
        choices: [
          {
            index: 0,
            delta: { content: chunk.content },
            finish_reason: chunk.finish_reason ?? null,
          },
        ],
      })}\n\n`
    )

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sseChunks.join('') + 'data: [DONE]\n\n',
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  /**
   * Configure mock response for a specific request type
   */
  setMockResponse(type: 'chat' | 'completion' | 'embedding', response: MockResponse): void {
    this.routes.set(type, response)
  }

  /**
   * Configure streaming response with multiple chunks
   */
  setStreamingResponse(type: 'chat' | 'completion', chunks: StreamChunk[]): void {
    this.streamingRoutes.set(type, chunks)
  }

  /**
   * Clear all mock configurations
   */
  clear(): void {
    this.routes.clear()
    this.streamingRoutes.clear()
  }

  /**
   * Stop intercepting routes
   */
  async teardown(): Promise<void> {
    await this.page.unroute('**/v1/**')
  }
}

/**
 * Mock a 429 rate limit response
 */
export function createRateLimitResponse(retryAfter: number = 60): MockResponse {
  return {
    status: 429,
    body: {
      error: {
        message: 'Rate limit exceeded. Please retry after some time.',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
      },
    },
    headers: {
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter),
    },
  }
}

/**
 * Mock a 401 unauthorized response
 */
export function createUnauthorizedResponse(provider: string = 'provider'): MockResponse {
  return {
    status: 401,
    body: {
      error: {
        message: `Invalid authentication credentials for ${provider}`,
        type: 'authentication_error',
        code: 'invalid_api_key',
      },
    },
  }
}

/**
 * Mock a 403 forbidden response (e.g., subscription expired)
 */
export function createForbiddenResponse(provider: string = 'provider'): MockResponse {
  return {
    status: 403,
    body: {
      error: {
        message: `Access denied. Your ${provider} subscription may have expired.`,
        type: 'permission_error',
        code: 'subscription_expired',
      },
    },
  }
}

/**
 * Mock a successful chat completion response
 */
export function createSuccessResponse(content: string = 'Hello! How can I help you today?'): MockResponse {
  return {
    status: 200,
    body: {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-model',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: content.split(' ').length * 2,
        total_tokens: 10 + content.split(' ').length * 2,
      },
    },
  }
}

/**
 * Create streaming response chunks
 */
export function createStreamingChunks(content: string): StreamChunk[] {
  const words = content.split(' ')
  return words.map((word, index) => ({
    content: index === 0 ? word : ` ${word}`,
    finish_reason: index === words.length - 1 ? 'stop' : undefined,
  }))
}

/**
 * Mock a server error response
 */
export function createServerErrorResponse(): MockResponse {
  return {
    status: 500,
    body: {
      error: {
        message: 'Internal server error',
        type: 'server_error',
        code: 'internal_error',
      },
    },
  }
}

/**
 * Mock a model not found response
 */
export function createModelNotFoundResponse(model: string): MockResponse {
  return {
    status: 404,
    body: {
      error: {
        message: `Model '${model}' not found`,
        type: 'invalid_request_error',
        code: 'model_not_found',
      },
    },
  }
}

/**
 * Helper to verify streaming response was received correctly
 */
export async function verifyStreamingResponse(
  page: Page,
  expectedContent: string
): Promise<boolean> {
  // Wait for the response container to have content
  const responseLocator = page.locator('[data-testid="response-content"]')
  
  try {
    await responseLocator.waitFor({ state: 'visible', timeout: 5000 })
    const actualContent = await responseLocator.textContent()
    return actualContent?.includes(expectedContent) ?? false
  } catch {
    return false
  }
}

/**
 * Helper to simulate OAuth callback
 */
export async function mockOAuthCallback(
  page: Page,
  provider: string,
  success: boolean = true,
  error?: string
): Promise<void> {
  const callbackUrl = success
    ? `http://localhost:5173/oauth/callback?provider=${provider}&code=mock-auth-code&state=mock-state`
    : `http://localhost:5173/oauth/callback?provider=${provider}&error=${encodeURIComponent(error ?? 'access_denied')}`

  await page.goto(callbackUrl)
}

/**
 * Helper to wait for proxy to be ready
 */
export async function waitForProxyReady(page: Page, timeout: number = 10000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const statusEl = document.querySelector('[data-testid="proxy-status"]')
        return statusEl?.textContent?.includes('Running') ?? false
      },
      { timeout }
    )
    return true
  } catch {
    return false
  }
}

/**
 * Provider-specific response builders
 */
export const ProviderResponses = {
  claude: {
    success: (content: string = 'Claude response') => createSuccessResponse(content),
    rateLimit: () => ({
      ...createRateLimitResponse(),
      body: {
        error: {
          type: 'rate_limit_error',
          message: 'Number of request tokens has exceeded your per-minute rate limit',
        },
      },
    }),
    unauthorized: () => createUnauthorizedResponse('Claude'),
  },

  codex: {
    success: (content: string = 'Codex response') => createSuccessResponse(content),
    rateLimit: () => ({
      ...createRateLimitResponse(),
      body: {
        error: {
          message: 'Rate limit reached for requests',
          type: 'requests',
          code: 'rate_limit_exceeded',
        },
      },
    }),
    unauthorized: () => createUnauthorizedResponse('OpenAI'),
  },

  gemini: {
    success: (content: string = 'Gemini response') => createSuccessResponse(content),
    rateLimit: () => ({
      ...createRateLimitResponse(),
      body: {
        error: {
          code: 429,
          message: 'Resource exhausted',
          status: 'RESOURCE_EXHAUSTED',
        },
      },
    }),
    unauthorized: () => ({
      ...createUnauthorizedResponse('Gemini'),
      body: {
        error: {
          code: 401,
          message: 'API key not valid',
          status: 'UNAUTHENTICATED',
        },
      },
    }),
  },

  qwen: {
    success: (content: string = 'Qwen response') => createSuccessResponse(content),
    rateLimit: () => createRateLimitResponse(),
    unauthorized: () => createUnauthorizedResponse('Qwen'),
  },

  iflow: {
    success: (content: string = 'iFlow response') => createSuccessResponse(content),
    rateLimit: () => createRateLimitResponse(),
    unauthorized: () => createUnauthorizedResponse('iFlow'),
  },
}
