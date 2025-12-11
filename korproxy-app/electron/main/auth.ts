import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { join, basename } from 'path'
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from 'fs'
import { homedir } from 'os'
import {
  IPC_CHANNELS,
  type Account,
  type OAuthResult,
  type Provider,
} from '../common/ipc-types'
import {
  ProviderSchema,
  validateIpcPayload,
  IpcValidationError,
} from '../common/ipc-schemas'
import { getBinaryPath, getConfigPath, ensureConfigExists } from './config'

const AUTH_DIR = join(homedir(), '.cli-proxy-api')

const providerLoginFlags: Record<Provider, string> = {
  gemini: '--login',
  claude: '--claude-login',
  codex: '--codex-login',
  qwen: '--qwen-login',
  iflow: '--iflow-login',
}

function createErrorResponse(error: unknown): { success: false; error: string } {
  if (error instanceof IpcValidationError) {
    return { success: false, error: `Validation error: ${error.message}` }
  }
  if (error instanceof Error) {
    return { success: false, error: error.message }
  }
  return { success: false, error: 'An unknown error occurred' }
}

function detectProviderFromFilename(filename: string): Provider {
  const lower = filename.toLowerCase()
  if (lower.startsWith('claude')) return 'claude'
  if (lower.startsWith('codex')) return 'codex'
  if (lower.startsWith('qwen')) return 'qwen'
  if (lower.startsWith('iflow')) return 'iflow'
  if (lower.includes('gen-lang-client') || lower.includes('gemini')) return 'gemini'
  return 'gemini'
}

async function startOAuth(provider: Provider): Promise<OAuthResult> {
  return new Promise((resolve) => {
    const loginFlag = providerLoginFlags[provider]
    
    if (!loginFlag) {
      resolve({
        success: false,
        error: `Unknown provider: ${provider}`,
      })
      return
    }

    const binaryPath = getBinaryPath()
    
    if (!existsSync(binaryPath)) {
      resolve({
        success: false,
        error: `Binary not found at ${binaryPath}. Please reinstall the application.`,
      })
      return
    }

    ensureConfigExists()
    const configPath = getConfigPath()
    const args = ['-config', configPath, loginFlag]

    console.log(`Starting OAuth for ${provider} with: ${binaryPath} ${args.join(' ')}`)

    let authProcess: ChildProcess
    let output = ''
    let errorOutput = ''

    try {
      authProcess = spawn(binaryPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })
    } catch (error) {
      resolve({
        success: false,
        error: `Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      return
    }

    authProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString()
      output += message
      console.log(`[${provider} auth] ${message.trim()}`)
      
      // Auto-select ALL projects when prompted
      if (message.includes('Enter project ID') || message.includes('or ALL:')) {
        authProcess.stdin?.write('ALL\n')
      }
    })

    authProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString()
      errorOutput += message
      console.error(`[${provider} auth error] ${message.trim()}`)
    })

    authProcess.on('error', (error: Error) => {
      resolve({
        success: false,
        error: `Authentication process error: ${error.message}`,
      })
    })

    authProcess.on('exit', (code: number | null) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        resolve({
          success: false,
          error: errorOutput || output || `Authentication failed with code ${code}`,
        })
      }
    })

    setTimeout(() => {
      if (authProcess.exitCode === null) {
        authProcess.kill()
        resolve({
          success: false,
          error: 'Authentication timed out. Please try again.',
        })
      }
    }, 5 * 60 * 1000)
  })
}

function listAccounts(): Account[] {
  const accounts: Account[] = []
  
  if (!existsSync(AUTH_DIR)) {
    console.log(`Auth directory does not exist: ${AUTH_DIR}`)
    return accounts
  }

  try {
    const files = readdirSync(AUTH_DIR)
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      if (file === 'config.json') continue
      
      const filePath = join(AUTH_DIR, file)
      const stats = statSync(filePath)
      
      if (!stats.isFile()) continue

      try {
        const content = readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)
        
        const provider = detectProviderFromFilename(file)
        const nameWithoutExt = basename(file, '.json')
        
        let displayName = nameWithoutExt
        if (data.email) {
          displayName = data.email
        } else if (data.name) {
          displayName = data.name
        }

        const account: Account = {
          id: nameWithoutExt,
          name: displayName,
          email: data.email,
          provider,
          enabled: true,
          createdAt: stats.mtime.toISOString(),
          expiredAt: data.expired,
        }
        
        accounts.push(account)
      } catch (parseError) {
        console.error(`Failed to parse auth file ${file}:`, parseError)
      }
    }
  } catch (error) {
    console.error('Error listing accounts:', error)
  }

  return accounts
}

function removeAccount(filename: string): { success: boolean; error?: string } {
  try {
    const filePath = join(AUTH_DIR, `${filename}.json`)
    
    if (!existsSync(filePath)) {
      return { success: false, error: `Account file not found: ${filename}` }
    }
    
    unlinkSync(filePath)
    return { success: true }
  } catch (error) {
    return createErrorResponse(error)
  }
}

export function registerAuthHandlers(_mainWindow: BrowserWindow): void {
  ipcMain.handle(
    IPC_CHANNELS.AUTH_START_OAUTH,
    async (_, provider: unknown): Promise<OAuthResult> => {
      try {
        const validProvider = validateIpcPayload(
          IPC_CHANNELS.AUTH_START_OAUTH,
          ProviderSchema,
          provider
        )
        return startOAuth(validProvider)
      } catch (error) {
        return createErrorResponse(error) as OAuthResult
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_LIST_ACCOUNTS, (): Account[] => {
    return listAccounts()
  })

  ipcMain.handle(
    IPC_CHANNELS.AUTH_REMOVE_ACCOUNT,
    (_, id: unknown): { success: boolean; error?: string } => {
      if (typeof id !== 'string') {
        return { success: false, error: 'Invalid account ID' }
      }
      return removeAccount(id)
    }
  )

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_TOKEN, () => {
    return { success: false, error: 'Token management not needed - CLIProxyAPI handles tokens' }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_REFRESH_TOKEN, () => {
    return { success: false, error: 'Token refresh not needed - CLIProxyAPI handles tokens' }
  })
}
