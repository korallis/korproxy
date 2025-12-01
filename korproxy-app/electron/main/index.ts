import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { proxySidecar } from './sidecar'
import { registerIpcHandlers } from './ipc'
import { registerAuthHandlers } from './auth'
import { createTray, destroyTray } from './tray'
import { settingsStore } from './store'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const isDev = !app.isPackaged

function createWindow(): void {
  const savedBounds = settingsStore.get('windowBounds')
  
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
      preload: join(__dirname, '../preload/index.js'),
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

app.whenReady().then(async () => {
  createWindow()

  if (mainWindow) {
    createTray(mainWindow)
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
