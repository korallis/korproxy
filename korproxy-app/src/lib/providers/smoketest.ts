import { getProvider } from './registry'

export interface EndpointTestResult {
  passed: boolean
  latencyMs: number
  error?: string
  statusCode?: number
}

export interface SmoketestResult {
  providerId: string
  success: boolean
  completionTest?: EndpointTestResult
  chatTest?: EndpointTestResult
  timestamp: string
}

const DEFAULT_PORT = 1337
const TEST_TIMEOUT_MS = 30000

async function testEndpoint(
  url: string,
  body: object,
  timeoutMs: number = TEST_TIMEOUT_MS
): Promise<EndpointTestResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const startTime = performance.now()
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const latencyMs = Math.round(performance.now() - startTime)
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        passed: false,
        latencyMs,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      }
    }

    return {
      passed: true,
      latencyMs,
      statusCode: response.status,
    }
  } catch (err) {
    clearTimeout(timeoutId)
    const latencyMs = Math.round(performance.now() - startTime)

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          passed: false,
          latencyMs,
          error: `Request timeout after ${timeoutMs}ms`,
        }
      }
      return {
        passed: false,
        latencyMs,
        error: err.message,
      }
    }

    return {
      passed: false,
      latencyMs,
      error: 'Unknown error occurred',
    }
  }
}

export async function runProviderSmoketest(
  providerId: string,
  port: number = DEFAULT_PORT
): Promise<SmoketestResult> {
  const provider = getProvider(providerId)
  if (!provider) {
    return {
      providerId,
      success: false,
      timestamp: new Date().toISOString(),
    }
  }

  const baseUrl = `http://localhost:${port}`
  const defaultModel = provider.models[0]?.id

  if (!defaultModel) {
    return {
      providerId,
      success: false,
      timestamp: new Date().toISOString(),
    }
  }

  const chatBody = {
    model: defaultModel,
    messages: [{ role: 'user', content: 'Say "OK" and nothing else.' }],
    max_tokens: 10,
  }

  const completionBody = {
    model: defaultModel,
    prompt: 'Say OK:',
    max_tokens: 10,
  }

  const [chatResult, completionResult] = await Promise.all([
    testEndpoint(`${baseUrl}${provider.endpoints.chat}`, chatBody),
    testEndpoint(`${baseUrl}${provider.endpoints.completion}`, completionBody),
  ])

  return {
    providerId,
    success: chatResult.passed || completionResult.passed,
    chatTest: chatResult,
    completionTest: completionResult,
    timestamp: new Date().toISOString(),
  }
}

export async function runAllProvidersSmoketest(
  port: number = DEFAULT_PORT
): Promise<SmoketestResult[]> {
  const { PROVIDER_REGISTRY } = await import('./registry')
  const results = await Promise.all(
    PROVIDER_REGISTRY.map((provider) => runProviderSmoketest(provider.id, port))
  )
  return results
}

export function formatSmoketestResult(result: SmoketestResult): string {
  const status = result.success ? '✓' : '✗'
  let output = `${status} ${result.providerId}`

  if (result.chatTest) {
    const chatStatus = result.chatTest.passed ? '✓' : '✗'
    output += `\n  Chat: ${chatStatus} (${result.chatTest.latencyMs}ms)`
    if (result.chatTest.error) {
      output += ` - ${result.chatTest.error}`
    }
  }

  if (result.completionTest) {
    const compStatus = result.completionTest.passed ? '✓' : '✗'
    output += `\n  Completion: ${compStatus} (${result.completionTest.latencyMs}ms)`
    if (result.completionTest.error) {
      output += ` - ${result.completionTest.error}`
    }
  }

  return output
}
