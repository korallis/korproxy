import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, writeFileSync, mkdirSync } from 'fs'

const DEFAULT_PORT = 1337

export function getConfigPath(): string {
  return join(app.getPath('userData'), 'config.yaml')
}

export function generateDefaultConfig(port: number = DEFAULT_PORT): string {
  return `# KorProxy default configuration
port: ${port}

# Authentication directory
auth-dir: "~/.cli-proxy-api"

# Enable debug logging
debug: false

# Request retry settings
request-retry: 3
max-retry-interval: 30

# Quota exceeded behavior
quota-exceeded:
  switch-project: true
  switch-preview-model: true
`
}

export function ensureConfigExists(port: number = DEFAULT_PORT): void {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    const configDir = dirname(configPath)
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }
    writeFileSync(configPath, generateDefaultConfig(port), 'utf-8')
  }
}

export function getBinaryPath(): string {
  const platform = process.platform
  const arch = process.arch

  let binaryName = 'cliproxy'
  if (platform === 'win32') {
    binaryName = 'cliproxy.exe'
  }

  let platformArch: string
  if (platform === 'darwin') {
    platformArch = arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  } else if (platform === 'win32') {
    platformArch = 'win32-x64'
  } else if (platform === 'linux') {
    platformArch = 'linux-x64'
  } else {
    platformArch = `${platform}-${arch}`
  }

  if (app.isPackaged) {
    return join(process.resourcesPath, 'binaries', binaryName)
  }

  return join(app.getAppPath(), 'resources', 'binaries', platformArch, binaryName)
}
