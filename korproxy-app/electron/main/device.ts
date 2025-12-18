import { randomUUID } from 'crypto'
import { homedir, hostname } from 'os'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { app } from 'electron'

const DEVICE_ID_PATH = join(homedir(), '.korproxy', 'device-id')

export type DeviceType = 'desktop' | 'laptop' | 'other'
export type Platform = 'darwin' | 'win32' | 'linux'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: DeviceType
  platform: Platform
  appVersion: string
}

export function getDeviceId(): string {
  try {
    if (existsSync(DEVICE_ID_PATH)) {
      const id = readFileSync(DEVICE_ID_PATH, 'utf-8').trim()
      if (id.length > 0) {
        return id
      }
    }
  } catch {
    // File doesn't exist or can't be read, generate new ID
  }

  const newId = randomUUID()
  
  try {
    const dir = join(homedir(), '.korproxy')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(DEVICE_ID_PATH, newId, 'utf-8')
  } catch (error) {
    console.error('Failed to persist device ID:', error)
  }

  return newId
}

export function getDeviceName(): string {
  return hostname()
}

export function getDeviceType(): DeviceType {
  return 'desktop'
}

export function getPlatform(): Platform {
  const platform = process.platform
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform
  }
  return 'linux'
}

export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    deviceType: getDeviceType(),
    platform: getPlatform(),
    appVersion: app.getVersion(),
  }
}
