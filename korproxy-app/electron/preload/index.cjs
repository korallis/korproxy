const { contextBridge, ipcRenderer } = require('electron')

const IPC_CHANNELS = {
  PROXY_START: 'proxy:start',
  PROXY_STOP: 'proxy:stop',
  PROXY_STATUS: 'proxy:status',
  PROXY_RESTART: 'proxy:restart',
  PROXY_LOG: 'proxy:log',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
  APP_IS_MAXIMIZED: 'app:is-maximized',
  APP_GET_SETTINGS: 'app:get-settings',
  APP_SET_SETTING: 'app:set-setting',
  AUTH_START_OAUTH: 'auth:start-oauth',
  AUTH_LIST_ACCOUNTS: 'auth:list-accounts',
  AUTH_REMOVE_ACCOUNT: 'auth:remove-account',
  AUTH_GET_TOKEN: 'auth:get-token',
  AUTH_REFRESH_TOKEN: 'auth:refresh-token',
  UPDATER_CHECK: 'updater:check',
  UPDATER_DOWNLOAD: 'updater:download',
  UPDATER_INSTALL: 'updater:install',
  UPDATER_STATUS: 'updater:status',
  APP_GET_VERSION: 'app:get-version',
  PROXY_STATS: 'proxy:stats',
}

const korproxyAPI = {
  proxy: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_START),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STOP),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STATUS),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STATUS),
    restart: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_RESTART),
    onLog: (callback) => {
      const handler = (_event, data) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.PROXY_LOG, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.PROXY_LOG, handler)
    },
    onStatusChange: (callback) => {
      let lastStatus = null
      const pollInterval = setInterval(async () => {
        const status = await ipcRenderer.invoke(IPC_CHANNELS.PROXY_STATUS)
        if (lastStatus === null || lastStatus.running !== status.running) {
          lastStatus = status
          callback(status)
        }
      }, 1000)
      return () => clearInterval(pollInterval)
    },
    getStats: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STATS),
  },
  config: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
    set: (content) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, content),
  },
  app: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.APP_IS_MAXIMIZED),
    platform: process.platform,
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_SETTINGS),
    setSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.APP_SET_SETTING, key, value),
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  },
  auth: {
    startOAuth: (provider) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_START_OAUTH, provider),
    listAccounts: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LIST_ACCOUNTS),
    removeAccount: (id, provider) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_REMOVE_ACCOUNT, id, provider),
    getToken: (provider, accountId) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_TOKEN, provider, accountId),
    refreshToken: (provider, accountId) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_REFRESH_TOKEN, provider, accountId),
  },
  updater: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_CHECK),
    download: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_DOWNLOAD),
    install: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_INSTALL),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_STATUS),
    onStatus: (callback) => {
      const handler = (_event, status) => callback(status)
      ipcRenderer.on(IPC_CHANNELS.UPDATER_STATUS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATER_STATUS, handler)
    },
  },
}

contextBridge.exposeInMainWorld('korproxy', korproxyAPI)
