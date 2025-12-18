import http from 'http'
import type { ProviderTestResult, ProviderTestErrorCode } from '../common/ipc-types'
import { PROVIDER_DEFAULT_MODELS } from '../common/ipc-types'
import { proxySidecar } from './sidecar'
import { logManager } from './log-manager'

const TEST_TIMEOUT = 30_000 // 30 seconds

interface TestPayload {
  model: string
  messages: Array<{ role: string; content: string }>
  max_tokens: number
}

function buildTestPayload(model: string): TestPayload {
  return {
    model,
    messages: [{ role: 'user', content: 'Say OK' }],
    max_tokens: 10,
  }
}

function mapErrorToCode(statusCode: number | undefined, errorMessage: string): ProviderTestErrorCode {
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
    return 'PROXY_NOT_RUNNING'
  }
  if (errorMessage.includes('timeout') || errorMessage.toLowerCase().includes('timeout')) {
    return 'TIMEOUT'
  }
  if (statusCode === 401 || errorMessage.includes('expired') || errorMessage.includes('invalid_api_key')) {
    return 'TOKEN_EXPIRED'
  }
  if (statusCode === 429 || errorMessage.includes('rate') || errorMessage.includes('quota')) {
    return 'QUOTA_EXCEEDED'
  }
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
    return 'NETWORK_ERROR'
  }
  return 'PROVIDER_ERROR'
}

export async function runProviderTest(
  providerId: string,
  modelId?: string
): Promise<ProviderTestResult> {
  const timestamp = new Date().toISOString()
  const port = proxySidecar.getPort()

  if (!proxySidecar.isRunning()) {
    const result: ProviderTestResult = {
      providerId,
      success: false,
      errorCode: 'PROXY_NOT_RUNNING',
      errorMessage: 'Proxy is not running. Start the proxy first.',
      timestamp,
    }
    logManager.warn('Provider test failed: proxy not running', { providerId }, 'provider-test')
    return result
  }

  const model = modelId || PROVIDER_DEFAULT_MODELS[providerId] || 'gpt-4'
  const payload = buildTestPayload(model)
  const startTime = Date.now()

  return new Promise((resolve) => {
    const body = JSON.stringify(payload)
    
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: TEST_TIMEOUT,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          const latencyMs = Date.now() - startTime

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const result: ProviderTestResult = {
              providerId,
              success: true,
              latencyMs,
              timestamp,
            }
            logManager.info('Provider test succeeded', { 
              providerId, 
              latencyMs,
              model 
            }, 'provider-test')
            resolve(result)
          } else {
            let errorMessage = `HTTP ${res.statusCode}`
            try {
              const parsed = JSON.parse(data)
              errorMessage = parsed.error?.message || parsed.message || errorMessage
            } catch {
              // Use default message
            }

            const result: ProviderTestResult = {
              providerId,
              success: false,
              latencyMs,
              errorCode: mapErrorToCode(res.statusCode, errorMessage),
              errorMessage,
              timestamp,
            }
            logManager.warn('Provider test failed', { 
              providerId, 
              latencyMs,
              errorCode: result.errorCode,
              errorMessage,
            }, 'provider-test')
            resolve(result)
          }
        })
      }
    )

    req.on('error', (error) => {
      const latencyMs = Date.now() - startTime
      const result: ProviderTestResult = {
        providerId,
        success: false,
        latencyMs,
        errorCode: mapErrorToCode(undefined, error.message),
        errorMessage: error.message,
        timestamp,
      }
      logManager.error('Provider test error', { 
        providerId, 
        error: error.message,
      }, 'provider-test')
      resolve(result)
    })

    req.on('timeout', () => {
      req.destroy()
      const latencyMs = Date.now() - startTime
      const result: ProviderTestResult = {
        providerId,
        success: false,
        latencyMs,
        errorCode: 'TIMEOUT',
        errorMessage: `Request timed out after ${TEST_TIMEOUT / 1000} seconds`,
        timestamp,
      }
      logManager.warn('Provider test timed out', { 
        providerId, 
        latencyMs,
      }, 'provider-test')
      resolve(result)
    })

    req.write(body)
    req.end()
  })
}
