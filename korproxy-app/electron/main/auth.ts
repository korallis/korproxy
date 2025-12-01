import { ipcMain, shell, BrowserWindow } from 'electron'

const PROXY_BASE_URL = 'http://localhost:1337'
const MANAGEMENT_API = `${PROXY_BASE_URL}/v0/management`

export interface Account {
  id: string
  name: string
  provider: string
  enabled: boolean
}

export interface OAuthResult {
  success: boolean
  error?: string
}

export const IPC_AUTH_CHANNELS = {
  AUTH_START_OAUTH: 'auth:start-oauth',
  AUTH_LIST_ACCOUNTS: 'auth:list-accounts',
  AUTH_REMOVE_ACCOUNT: 'auth:remove-account',
} as const

const providerOAuthEndpoints: Record<string, string> = {
  gemini: `${MANAGEMENT_API}/oauth/google/start`,
  claude: `${MANAGEMENT_API}/oauth/anthropic/start`,
  codex: `${MANAGEMENT_API}/oauth/openai/start`,
  openai: `${MANAGEMENT_API}/oauth/openai/start`,
  qwen: `${MANAGEMENT_API}/oauth/qwen/start`,
  iflow: `${MANAGEMENT_API}/oauth/iflow/start`,
}

async function startOAuth(provider: string): Promise<OAuthResult> {
  try {
    const endpoint = providerOAuthEndpoints[provider.toLowerCase()]
    
    if (!endpoint) {
      return {
        success: false,
        error: `Unknown provider: ${provider}`,
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Failed to initiate OAuth: ${errorText}`,
      }
    }

    const data = await response.json()
    
    if (data.url) {
      await shell.openExternal(data.url)
      return { success: true }
    }

    return {
      success: false,
      error: 'No OAuth URL returned from server',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start OAuth',
    }
  }
}

async function listAccounts(): Promise<Account[]> {
  try {
    const response = await fetch(`${MANAGEMENT_API}/accounts`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to list accounts:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.accounts || data || []
  } catch (error) {
    console.error('Error listing accounts:', error)
    return []
  }
}

async function removeAccount(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${MANAGEMENT_API}/accounts/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Failed to remove account: ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove account',
    }
  }
}

export function registerAuthHandlers(_mainWindow: BrowserWindow): void {
  ipcMain.handle(
    IPC_AUTH_CHANNELS.AUTH_START_OAUTH,
    async (_, provider: string): Promise<OAuthResult> => {
      return startOAuth(provider)
    }
  )

  ipcMain.handle(
    IPC_AUTH_CHANNELS.AUTH_LIST_ACCOUNTS,
    async (): Promise<Account[]> => {
      return listAccounts()
    }
  )

  ipcMain.handle(
    IPC_AUTH_CHANNELS.AUTH_REMOVE_ACCOUNT,
    async (_, id: string): Promise<{ success: boolean; error?: string }> => {
      return removeAccount(id)
    }
  )
}
