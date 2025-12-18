import { mkdir, writeFile, rename, unlink } from 'fs/promises'
import { join } from 'path'
import { homedir, platform } from 'os'
import type { RoutingConfig } from '../common/ipc-types'

const CONFIG_DIR_NAME = '.korproxy'
const CONFIG_FILE_NAME = 'config.json'

/**
 * Get the path to the KorProxy config directory.
 * Cross-platform: ~/.korproxy/ on Unix, %LOCALAPPDATA%\.korproxy on Windows
 */
export function getConfigDir(): string {
  if (platform() === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA
    if (localAppData) {
      return join(localAppData, CONFIG_DIR_NAME)
    }
    return join(homedir(), CONFIG_DIR_NAME)
  }
  return join(homedir(), CONFIG_DIR_NAME)
}

/**
 * Get the full path to the routing config file.
 */
export function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE_NAME)
}

/**
 * Ensure the config directory exists.
 */
async function ensureConfigDir(): Promise<void> {
  const dir = getConfigDir()
  await mkdir(dir, { recursive: true })
}

/**
 * Write the routing configuration to disk.
 * Uses atomic write (temp file + rename) to prevent corruption.
 */
export async function writeRoutingConfig(config: RoutingConfig): Promise<void> {
  await ensureConfigDir()

  const configPath = getConfigPath()
  const tempPath = configPath + '.tmp'

  try {
    const data = JSON.stringify(config, null, 2)
    await writeFile(tempPath, data, 'utf-8')
    await rename(tempPath, configPath)
  } catch (error) {
    // Clean up temp file if rename failed
    try {
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Get the path to the metrics directory.
 */
export function getMetricsDir(): string {
  return join(getConfigDir(), 'metrics')
}
