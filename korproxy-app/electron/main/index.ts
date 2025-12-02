import { app, BrowserWindow, shell, session } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { proxySidecar } from './sidecar'
import { registerIpcHandlers } from './ipc'
import { registerAuthHandlers } from './auth'
import { createTray, destroyTray } from './tray'
import { settingsStore } from './store'
import { initAutoUpdater } from './updater'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const isDev = !app.isPackaged

function createWindow(): void {
  const savedBounds = settingsStore.get('windowBounds')
  
  const preloadPath = join(__dirname, '../preload/index.cjs')
  console.log('Preload path:', preloadPath)
  
  mainWindow = new BrowserWindow({
    width: savedBounds?.width ?? 1200,
    height: savedBounds?.height ?? 800,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 10 },
    backgroundColor: '#0a0a0f',
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  registerIpcHandlers(mainWindow)
  registerAuthHandlers(mainWindow)
  initAutoUpdater(mainWindow)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting && settingsStore.get('minimizeToTray')) {
      event.preventDefault()
      mainWindow?.hide()
      return
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)
}

function saveBounds(): void {
  if (!mainWindow || mainWindow.isMaximized() || mainWindow.isMinimized()) return
  
  const bounds = mainWindow.getBounds()
  settingsStore.set('windowBounds', bounds)
}

function setupContentSecurityPolicy(): void {
  // Only apply strict CSP in production - dev mode needs inline scripts for Vite HMR
  if (isDev) return

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' http://localhost:* https://*.convex.cloud wss://*.convex.cloud",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })
}

app.whenReady().then(async () => {
  setupContentSecurityPolicy()
  createWindow()

  if (mainWindow) {
    createTray(mainWindow)
  }

  const savedPort = settingsStore.get('port')
  if (savedPort) {
    proxySidecar.setPort(savedPort)
  }

  if (settingsStore.get('autoStart')) {
    try {
      await proxySidecar.start()
    } catch (error) {
      console.error('Failed to start proxy sidecar:', error)
    }
  }

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    proxySidecar.stop()
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  proxySidecar.stop()
  destroyTray()
})
