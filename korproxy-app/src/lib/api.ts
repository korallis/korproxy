const BASE_URL = 'http://localhost:1337'

export interface Account {
  id: string
  auth_index?: number
  name: string
  type: string
  provider: string
  label?: string
  email?: string
  account?: string
  account_type?: string
  status?: string
  status_message?: string
  disabled?: boolean
  unavailable?: boolean
  runtime_only?: boolean
  source?: string
  size?: number
  created_at?: string
  modtime?: string
}

export interface ProxyStatus {
  running: boolean
  version?: string
}

export interface Stats {
  total_requests?: number
  requests_today?: number
  errors?: number
}

export interface Config {
  port: number
  logLevel: string
  debug?: boolean
}

export interface AuthUrlResponse {
  url: string
  state?: string
}

class ProxyAPI {
  private baseUrl: string

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to proxy server')
      }
      throw error
    }
  }

  async getStatus(): Promise<ProxyStatus> {
    try {
      await this.fetch('/v1/models')
      return { running: true, version: '1.0.0' }
    } catch {
      return { running: false }
    }
  }

  async getAccounts(): Promise<Account[]> {
    const response = await this.fetch<{ files: Account[] }>('/v0/management/auth-files')
    return response.files || []
  }

  async getStats(): Promise<Stats> {
    try {
      const response = await this.fetch<Stats>('/v0/management/usage')
      return response
    } catch {
      return { total_requests: 0, requests_today: 0, errors: 0 }
    }
  }

  async getConfig(): Promise<Config> {
    if (window.korproxy) {
      const config = await window.korproxy.config.get()
      return {
        port: config.port,
        logLevel: config.logLevel,
      }
    }
    return { port: 1337, logLevel: 'info' }
  }

  async deleteAccount(filename: string): Promise<void> {
    await this.fetch(`/v0/management/auth-files?name=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    })
  }

  async startOAuth(provider: string): Promise<void> {
    const endpoints: Record<string, string> = {
      claude: '/v0/management/anthropic-auth-url',
      codex: '/v0/management/codex-auth-url',
      openai: '/v0/management/codex-auth-url',
      gemini: '/v0/management/gemini-cli-auth-url',
      qwen: '/v0/management/qwen-auth-url',
      iflow: '/v0/management/iflow-auth-url',
    }

    const endpoint = endpoints[provider.toLowerCase()]
    if (!endpoint) {
      throw new Error(`Unknown provider: ${provider}`)
    }

    const response = await this.fetch<AuthUrlResponse>(endpoint)
    if (response.url) {
      window.open(response.url, '_blank')
    }
  }

  async getAuthStatus(): Promise<{ status: string; message?: string }> {
    return this.fetch('/v0/management/get-auth-status')
  }
}

export const proxyApi = new ProxyAPI()
