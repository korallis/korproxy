import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export interface Settings {
  port: number
  autoStart: boolean
  minimizeToTray: boolean
  theme: 'dark' | 'light' | 'system'
  windowBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

const defaultSettings: Settings = {
  port: 1337,
  autoStart: true,
  minimizeToTray: true,
  theme: 'dark',
}

class SettingsStore {
  private filePath: string
  private data: Settings

  constructor() {
    const userDataPath = app.getPath('userData')
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
    this.filePath = join(userDataPath, 'settings.json')
    this.data = this.load()
  }

  private load(): Settings {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf-8')
        return { ...defaultSettings, ...JSON.parse(content) }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return { ...defaultSettings }
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  get<K extends keyof Settings>(key: K, defaultValue?: Settings[K]): Settings[K] {
    return this.data[key] ?? defaultValue ?? defaultSettings[key]
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.data[key] = value
    this.save()
  }

  getAll(): Settings {
    return { ...this.data }
  }

  setAll(settings: Partial<Settings>): void {
    this.data = { ...this.data, ...settings }
    this.save()
  }
}

export const settingsStore = new SettingsStore()
