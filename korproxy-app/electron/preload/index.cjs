const { contextBridge, ipcRenderer } = require('electron')

const IPC_CHANNELS = {
  PROXY_START: 'proxy:start',
  PROXY_STOP: 'proxy:stop',
  PROXY_STATUS: 'proxy:status',
  PROXY_RESTART: 'proxy:restart',
  PROXY_LOG: 'proxy:log',
  PROXY_HEALTH: 'proxy:health',
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
  SUBSCRIPTION_SET: 'subscription:set',
  INTEGRATIONS_FACTORY_GET: 'integrations:factory:get',
  INTEGRATIONS_FACTORY_SET: 'integrations:factory:set',
  INTEGRATIONS_AMP_GET: 'integrations:amp:get',
  INTEGRATIONS_AMP_SET: 'integrations:amp:set',
  PROVIDER_TEST_RUN: 'provider:test:run',
  TOOL_INTEGRATION_LIST: 'tool:integration:list',
  TOOL_INTEGRATION_COPY: 'tool:integration:copy',
  LOGS_GET: 'logs:get',
  LOGS_EXPORT: 'logs:export',
  LOGS_CLEAR: 'logs:clear',
  // Phase C: Config Sync
  CONFIG_SYNC: 'config:sync',
  METRICS_GET: 'metrics:get',
  // Phase C: Tray Profile Integration
  TRAY_SYNC_PROFILES: 'tray:sync-profiles',
  TRAY_GET_ACTIVE_PROFILE: 'tray:get-active-profile',
  TRAY_PROFILE_CHANGED: 'tray:profile-changed',
  // TG4: Entitlements
  ENTITLEMENTS_GET: 'entitlements:get',
  ENTITLEMENTS_SET: 'entitlements:set',
  // TG6: Device Sync
  DEVICE_REGISTER: 'device:register',
  DEVICE_GET_INFO: 'device:get-info',
  // TG5: Feedback System
  FEEDBACK_SUBMIT: 'feedback:submit',
  LOGS_GET_RECENT: 'logs:get-recent',
  SYSTEM_GET_INFO: 'system:get-info',
  // TG6: Deep Link Attribution
  DEEPLINK_GET_UTM: 'deeplink:get-utm',
  DEEPLINK_CLEAR_UTM: 'deeplink:clear-utm',
  // TG3: Diagnostics
  DIAGNOSTICS_GET_BUNDLE: 'diagnostics:get-bundle',
  DIAGNOSTICS_GET_RECENT_REQUESTS: 'diagnostics:get-recent-requests',
  DIAGNOSTICS_COPY_BUNDLE: 'diagnostics:copy-bundle',
  // TG5: Metrics Dashboard
  METRICS_GET_SUMMARY: 'metrics:get-summary',
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
    // Phase C: Routing config sync for Go backend
    sync: (config) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SYNC, config),
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
  subscription: {
    setStatus: (info) => ipcRenderer.invoke(IPC_CHANNELS.SUBSCRIPTION_SET, info),
  },
  integrations: {
    factory: {
      get: () => ipcRenderer.invoke(IPC_CHANNELS.INTEGRATIONS_FACTORY_GET),
      set: (models) => ipcRenderer.invoke(IPC_CHANNELS.INTEGRATIONS_FACTORY_SET, models),
    },
    amp: {
      get: () => ipcRenderer.invoke(IPC_CHANNELS.INTEGRATIONS_AMP_GET),
      set: (port) => ipcRenderer.invoke(IPC_CHANNELS.INTEGRATIONS_AMP_SET, port),
    },
  },
  // Phase A: Health Monitor
  health: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_HEALTH),
    onStateChange: (callback) => {
      const handler = (_event, status) => callback(status)
      ipcRenderer.on(IPC_CHANNELS.PROXY_HEALTH, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.PROXY_HEALTH, handler)
    },
  },
  // Phase A: Provider Testing
  provider: {
    test: (providerId, modelId) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_TEST_RUN, { providerId, modelId }),
  },
  // Phase A: Tool Integrations
  tools: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.TOOL_INTEGRATION_LIST),
    copyConfig: (toolId) => ipcRenderer.invoke(IPC_CHANNELS.TOOL_INTEGRATION_COPY, toolId),
  },
  // Phase A: Logs
  logs: {
    get: (options) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_GET, options),
    export: () => ipcRenderer.invoke(IPC_CHANNELS.LOGS_EXPORT),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.LOGS_CLEAR),
  },
  // Phase C: Tray Profile Integration
  tray: {
    syncProfiles: (config) => ipcRenderer.invoke(IPC_CHANNELS.TRAY_SYNC_PROFILES, config),
    getActiveProfile: () => ipcRenderer.invoke(IPC_CHANNELS.TRAY_GET_ACTIVE_PROFILE),
    onProfileChanged: (callback) => {
      const handler = (_event, profileId) => callback(profileId)
      ipcRenderer.on(IPC_CHANNELS.TRAY_PROFILE_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TRAY_PROFILE_CHANGED, handler)
    },
  },
  // TG4: Entitlements
  entitlements: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.ENTITLEMENTS_GET),
    set: (entitlements) => ipcRenderer.invoke(IPC_CHANNELS.ENTITLEMENTS_SET, entitlements),
  },
  // TG6: Device Sync
  device: {
    register: () => ipcRenderer.invoke(IPC_CHANNELS.DEVICE_REGISTER),
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.DEVICE_GET_INFO),
  },
  // TG5: Feedback System
  feedback: {
    submit: (data) => ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_SUBMIT, data),
    getRecentLogs: (count) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_GET_RECENT, count),
    getSystemInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO),
  },
  // TG6: Deep Link Attribution
  deeplink: {
    getUtm: () => ipcRenderer.invoke(IPC_CHANNELS.DEEPLINK_GET_UTM),
    clearUtm: () => ipcRenderer.invoke(IPC_CHANNELS.DEEPLINK_CLEAR_UTM),
  },
  // TG3: Diagnostics
  diagnostics: {
    getBundle: (config, providers, metrics) => ipcRenderer.invoke(IPC_CHANNELS.DIAGNOSTICS_GET_BUNDLE, config, providers, metrics),
    getRecentRequests: (filter) => ipcRenderer.invoke(IPC_CHANNELS.DIAGNOSTICS_GET_RECENT_REQUESTS, filter),
    copyBundleToClipboard: (config, providers, metrics) => ipcRenderer.invoke(IPC_CHANNELS.DIAGNOSTICS_COPY_BUNDLE, config, providers, metrics),
  },
  // TG5: Metrics Dashboard
  metrics: {
    getSummary: (timeRange) => ipcRenderer.invoke(IPC_CHANNELS.METRICS_GET_SUMMARY, timeRange),
  },
}

contextBridge.exposeInMainWorld('korproxy', korproxyAPI)
