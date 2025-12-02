import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { proxySidecar } from './sidecar'

let tray: Tray | null = null

function createTrayIconFromDataURL(running: boolean): Electron.NativeImage {
  const color = running ? '#22c55e' : '#6b7280'
  const size = 32
  
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle with subtle gradient -->
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${running ? '#16a34a' : '#52525b'};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#bgGrad)"/>
      <!-- K letter - modern rounded style optimized for 16x16 -->
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
  const isRunning = proxySidecar.isRunning()
  const icon = createTrayIconFromDataURL(isRunning)
  
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
  tray.setImage(createTrayIconFromDataURL(isRunning))
  tray.setContextMenu(buildContextMenu(mainWindow))
  tray.setToolTip(`KorProxy - ${isRunning ? 'Running' : 'Stopped'}`)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
