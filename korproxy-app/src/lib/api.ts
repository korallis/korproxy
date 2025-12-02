const DEFAULT_PORT = 1337

export interface ProxyStatus {
  running: boolean
  version?: string
}

export interface Stats {
  total_requests?: number
  requests_today?: number
  errors?: number
}

class ProxyAPI {
  private port: number = DEFAULT_PORT

  setPort(port: number): void {
    this.port = port
  }

  getPort(): number {
    return this.port
  }

  private get baseUrl(): string {
    return `http://localhost:${this.port}`
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
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
  }

  async getStatus(): Promise<ProxyStatus> {
    try {
      await this.fetch('/v1/models')
      return { running: true, version: '1.0.0' }
    } catch {
      return { running: false }
    }
  }

  async getStats(): Promise<Stats> {
    try {
      const response = await this.fetch<Stats>('/v0/management/usage')
      return response
    } catch {
      return { total_requests: 0, requests_today: 0, errors: 0 }
    }
  }
}

export const proxyApi = new ProxyAPI()
