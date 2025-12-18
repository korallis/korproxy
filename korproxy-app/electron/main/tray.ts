import { Tray, Menu, nativeImage, BrowserWindow, app, ipcMain } from 'electron'
import { proxySidecar } from './sidecar'
import path from 'path'
import type { Profile, RoutingConfig } from '../common/ipc-types'

let tray: Tray | null = null
let mainWindowRef: BrowserWindow | null = null

// Profile state cache (synced from renderer)
interface ProfileCache {
  profiles: Profile[]
  activeProfileId: string | null
  loaded: boolean
}

const profileCache: ProfileCache = {
  profiles: [],
  activeProfileId: null,
  loaded: false,
}

function getTrayIcon(): Electron.NativeImage {
  // On Windows, use the actual .ico file for proper taskbar display
  if (process.platform === 'win32') {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico')
      : path.join(__dirname, '../../build/icon.ico')
    
    try {
      return nativeImage.createFromPath(iconPath)
    } catch {
      // Fallback to embedded icon if file not found
      return createTrayIconFromSVG()
    }
  }
  
  // On macOS/Linux, use SVG-based icon (supports template images)
  return createTrayIconFromSVG()
}

function createTrayIconFromSVG(): Electron.NativeImage {
  const size = 32
  const color = '#6b7280'
  
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#52525b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#bgGrad)"/>
      <path d="M10 8 L10 24 M10 16 L18 8 M10 16 L18 24" 
            stroke="white" 
            stroke-width="3.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            fill="none"/>
    </svg>
  `).toString('base64')}`
  
  const image = nativeImage.createFromDataURL(dataUrl)
  return image.resize({ width: 16, height: 16 })
}

function getActiveProfileName(): string {
  if (!profileCache.loaded || profileCache.profiles.length === 0) {
    return 'Default'
  }
  const active = profileCache.profiles.find(p => p.id === profileCache.activeProfileId)
  return active?.name ?? 'Default'
}

function buildProfilesSubmenu(mainWindow: BrowserWindow): Electron.MenuItemConstructorOptions[] {
  if (!profileCache.loaded || profileCache.profiles.length === 0) {
    return [
      {
        label: 'Loading...',
        enabled: false,
      },
    ]
  }

  return profileCache.profiles.map(profile => ({
    label: profile.name,
    type: 'radio' as const,
    checked: profile.id === profileCache.activeProfileId,
    click: () => {
      // Update local cache immediately for UI responsiveness
      profileCache.activeProfileId = profile.id
      updateTrayStatus(mainWindow)
      
      // Notify renderer to update store and sync config
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray:profile-changed', profile.id)
      }
    },
  }))
}

function buildContextMenu(mainWindow: BrowserWindow): Electron.Menu {
  const isRunning = proxySidecar.isRunning()
  
  return Menu.buildFromTemplate([
    {
      label: 'Show KorProxy',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'Profiles',
      submenu: buildProfilesSubmenu(mainWindow),
    },
    { type: 'separator' },
    {
      label: 'Start Proxy',
      enabled: !isRunning,
      click: async () => {
        try {
          await proxySidecar.start()
          updateTrayStatus(mainWindow)
        } catch (error) {
          console.error('Failed to start proxy:', error)
        }
      },
    },
    {
      label: 'Stop Proxy',
      enabled: isRunning,
      click: () => {
        proxySidecar.stop()
        updateTrayStatus(mainWindow)
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        proxySidecar.stop()
        app.quit()
      },
    },
  ])
}

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = getTrayIcon()
  mainWindowRef = mainWindow
  
  tray = new Tray(icon)
  tray.setToolTip('KorProxy - Stopped')
  tray.setContextMenu(buildContextMenu(mainWindow))
  
  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
  
  proxySidecar.on('started', () => {
    updateTrayStatus(mainWindow)
  })
  
  proxySidecar.on('stopped', () => {
    updateTrayStatus(mainWindow)
  })
  
  // Register IPC handler for profile state sync from renderer
  registerTrayIpcHandlers()
  
  return tray
}

function registerTrayIpcHandlers(): void {
  // Handler for renderer to sync profile state to main process
  ipcMain.handle('tray:sync-profiles', (_, config: RoutingConfig) => {
    profileCache.profiles = config.profiles || []
    profileCache.activeProfileId = config.activeProfileId
    profileCache.loaded = true
    
    if (mainWindowRef) {
      updateTrayStatus(mainWindowRef)
    }
    
    return { success: true }
  })
  
  // Handler to get current profile state (for renderer initialization)
  ipcMain.handle('tray:get-active-profile', () => {
    return {
      activeProfileId: profileCache.activeProfileId,
      loaded: profileCache.loaded,
    }
  })
}

export function updateTrayStatus(mainWindow: BrowserWindow): void {
  if (!tray) return
  
  const isRunning = proxySidecar.isRunning()
  const profileName = getActiveProfileName()
  const status = isRunning ? 'Running' : 'Stopped'
  
  // Update tooltip with profile name: "KorProxy - [Profile] - Running/Stopped"
  tray.setToolTip(`KorProxy - ${profileName} - ${status}`)
  tray.setContextMenu(buildContextMenu(mainWindow))
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
  mainWindowRef = null
}
