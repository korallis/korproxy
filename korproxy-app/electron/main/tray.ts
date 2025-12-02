import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { proxySidecar } from './sidecar'
import path from 'path'

let tray: Tray | null = null

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
  
  tray = new Tray(icon)
  tray.setToolTip('KorProxy')
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
  
  return tray
}

export function updateTrayStatus(mainWindow: BrowserWindow): void {
  if (!tray) return
  
  const isRunning = proxySidecar.isRunning()
  // Only update tooltip and menu, not icon (icon stays consistent on Windows)
  tray.setContextMenu(buildContextMenu(mainWindow))
  tray.setToolTip(`KorProxy - ${isRunning ? 'Running' : 'Stopped'}`)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
