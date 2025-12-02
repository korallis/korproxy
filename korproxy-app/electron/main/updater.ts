import { app, ipcMain, BrowserWindow } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import type { UpdateInfo, ProgressInfo } from 'electron-updater'
import { IPC_CHANNELS, UpdateStatus } from '../common/ipc-types'

let mainWindow: BrowserWindow | null = null
let currentStatus: UpdateStatus = { status: 'not-available' }

function sendStatusToRenderer(status: UpdateStatus): void {
  currentStatus = status
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER_STATUS, status)
  }
}

export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.on('checking-for-update', () => {
    sendStatusToRenderer({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendStatusToRenderer({
      status: 'available',
      version: info.version,
    })
  })

  autoUpdater.on('update-not-available', () => {
    sendStatusToRenderer({ status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    sendStatusToRenderer({
      status: 'downloading',
      progress: Math.round(progress.percent),
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendStatusToRenderer({
      status: 'downloaded',
      version: info.version,
    })
  })

  autoUpdater.on('error', (error: Error) => {
    sendStatusToRenderer({
      status: 'error',
      error: error.message,
    })
  })

  registerUpdaterIpcHandlers()

  if (app.isPackaged) {
    setTimeout(() => {
      checkForUpdates()
    }, 10000)
  }
}

async function checkForUpdates(): Promise<UpdateStatus> {
  try {
    sendStatusToRenderer({ status: 'checking' })
    await autoUpdater.checkForUpdates()
    return currentStatus
  } catch (error) {
    const errorStatus: UpdateStatus = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to check for updates',
    }
    sendStatusToRenderer(errorStatus)
    return errorStatus
  }
}

async function downloadUpdate(): Promise<UpdateStatus> {
  try {
    if (currentStatus.status !== 'available') {
      return { status: 'error', error: 'No update available to download' }
    }
    await autoUpdater.downloadUpdate()
    return currentStatus
  } catch (error) {
    const errorStatus: UpdateStatus = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to download update',
    }
    sendStatusToRenderer(errorStatus)
    return errorStatus
  }
}

function installUpdate(): void {
  if (currentStatus.status === 'downloaded') {
    autoUpdater.quitAndInstall(false, true)
  }
}

function registerUpdaterIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATER_CHECK, async (): Promise<UpdateStatus> => {
    return checkForUpdates()
  })

  ipcMain.handle(IPC_CHANNELS.UPDATER_DOWNLOAD, async (): Promise<UpdateStatus> => {
    return downloadUpdate()
  })

  ipcMain.handle(IPC_CHANNELS.UPDATER_INSTALL, (): void => {
    installUpdate()
  })

  ipcMain.handle(IPC_CHANNELS.UPDATER_STATUS, (): UpdateStatus => {
    return currentStatus
  })
}

export function setAutoUpdaterWindow(window: BrowserWindow): void {
  mainWindow = window
}
