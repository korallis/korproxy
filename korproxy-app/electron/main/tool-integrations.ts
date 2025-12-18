import { clipboard } from 'electron'
import { access } from 'fs/promises'
import { homedir } from 'os'
import type { ToolIntegration } from '../common/ipc-types'

interface ToolConfig {
  id: string
  displayName: string
  configPaths: Record<string, string>
  configSnippet: string
  instructions: string
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  cline: {
    id: 'cline',
    displayName: 'Cline',
    configPaths: {
      darwin: '~/Library/Application Support/Code/User/settings.json',
      linux: '~/.config/Code/User/settings.json',
      win32: '%APPDATA%/Code/User/settings.json',
    },
    configSnippet: JSON.stringify({
      'cline.apiProvider': 'openai',
      'cline.openai': {
        'apiKey': 'korproxy',
        'baseURL': 'http://localhost:{{PORT}}/v1'
      },
      'cline.defaultModel': 'claude-sonnet-4-5-20250929'
    }, null, 2),
    instructions: `1. Open VS Code Settings (Cmd+, or Ctrl+,)
2. Click the "Open Settings (JSON)" button in the top right
3. Add the configuration snippet to your settings.json
4. Save the file and restart Cline

Note: Merge with existing settings if you have other Cline configuration.`,
  },
  continue: {
    id: 'continue',
    displayName: 'Continue.dev',
    configPaths: {
      darwin: '~/.continue/config.json',
      linux: '~/.continue/config.json',
      win32: '~/.continue/config.json',
    },
    configSnippet: JSON.stringify({
      models: [
        {
          title: 'KorProxy Claude Sonnet 4.5',
          provider: 'openai',
          model: 'claude-sonnet-4-5-20250929',
          apiKey: 'korproxy',
          apiBase: 'http://localhost:{{PORT}}/v1'
        },
        {
          title: 'KorProxy GPT-5.1 Codex',
          provider: 'openai',
          model: 'gpt-5.1-codex',
          apiKey: 'korproxy',
          apiBase: 'http://localhost:{{PORT}}/v1'
        },
        {
          title: 'KorProxy Gemini 3 Pro',
          provider: 'openai',
          model: 'gemini-3-pro-preview',
          apiKey: 'korproxy',
          apiBase: 'http://localhost:{{PORT}}/v1'
        }
      ]
    }, null, 2),
    instructions: `1. Open or create ~/.continue/config.json
2. Add the models from the configuration snippet to your config
3. If you have existing models, add these to your models array
4. Save the file and reload Continue in VS Code

Tip: You can customize model titles to your preference.`,
  },
}

function expandPath(path: string): string {
  return path
    .replace(/^~/, homedir())
    .replace(/%APPDATA%/g, process.env.APPDATA || '')
}

async function detectTool(toolId: string): Promise<boolean> {
  const config = TOOL_CONFIGS[toolId]
  if (!config) return false

  const platform = process.platform as 'darwin' | 'linux' | 'win32'
  const configPath = config.configPaths[platform]
  if (!configPath) return false

  const expandedPath = expandPath(configPath)
  
  try {
    await access(expandedPath)
    return true
  } catch {
    return false
  }
}

function getConfigSnippet(toolId: string, port: number): string {
  const config = TOOL_CONFIGS[toolId]
  if (!config) return ''
  
  return config.configSnippet.replace(/\{\{PORT\}\}/g, String(port))
}

function getConfigPath(toolId: string): string | undefined {
  const config = TOOL_CONFIGS[toolId]
  if (!config) return undefined

  const platform = process.platform as 'darwin' | 'linux' | 'win32'
  const configPath = config.configPaths[platform]
  if (!configPath) return undefined

  return expandPath(configPath)
}

export async function getToolIntegrations(port: number): Promise<ToolIntegration[]> {
  const integrations: ToolIntegration[] = []

  for (const [id, config] of Object.entries(TOOL_CONFIGS)) {
    const detected = await detectTool(id)
    integrations.push({
      toolId: id,
      displayName: config.displayName,
      detected,
      configPath: getConfigPath(id),
      configSnippet: getConfigSnippet(id, port),
      instructions: config.instructions,
    })
  }

  return integrations
}

export function copyConfigToClipboard(toolId: string, port: number): boolean {
  const snippet = getConfigSnippet(toolId, port)
  if (!snippet) return false
  
  clipboard.writeText(snippet)
  return true
}
