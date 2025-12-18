// IPC types and constants - NO ZOD (safe for preload)

export const IPC_CHANNELS = {
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
  ENTITLEMENTS_GET: 'entitlements:get',
  ENTITLEMENTS_SET: 'entitlements:set',
  DEVICE_REGISTER: 'device:register',
  DEVICE_GET_INFO: 'device:get-info',
  DEVICE_UPDATE_LAST_SEEN: 'device:update-last-seen',
  FEEDBACK_SUBMIT: 'feedback:submit',
  LOGS_GET_RECENT: 'logs:get-recent',
  SYSTEM_GET_INFO: 'system:get-info',
  // TG3: Diagnostics
  DIAGNOSTICS_GET_BUNDLE: 'diagnostics:get-bundle',
  DIAGNOSTICS_GET_RECENT_REQUESTS: 'diagnostics:get-recent-requests',
  DIAGNOSTICS_COPY_BUNDLE: 'diagnostics:copy-bundle',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export const PROVIDERS = ['gemini', 'claude', 'codex', 'qwen', 'iflow'] as const
export type Provider = (typeof PROVIDERS)[number]

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type Theme = 'dark' | 'light' | 'system'

export interface Settings {
  port: number
  autoStart: boolean
  minimizeToTray: boolean
  theme: Theme
  windowBounds?: WindowBounds
}

export interface Account {
  id: string
  name: string
  email?: string
  provider: Provider
  enabled: boolean
  createdAt: string
  lastUsed?: string
  expiredAt?: string
}

export interface ProxyStatus {
  running: boolean
  port: number
}

export interface LogData {
  type: 'stdout' | 'stderr'
  message: string
  timestamp?: string
}

export interface OAuthResult {
  success: boolean
  error?: string
  accountId?: string
}

export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  progress?: number
  error?: string
}

export interface ProxyStats {
  totalRequests: number
  successCount: number
  failureCount: number
  totalTokens: number
  requestsByHour: Record<string, number>
  requestsByDay: Record<string, number>
}

export interface SubscriptionInfo {
  isValid: boolean
  expiresAt?: number
}

export interface FactoryCustomModel {
  model_display_name: string
  model: string
  base_url: string
  api_key: string
  provider: 'anthropic' | 'openai' | 'generic-chat-completion-api'
  max_tokens?: number
  supports_images?: boolean
}

export interface FactoryConfig {
  custom_models?: FactoryCustomModel[]
}

export interface AmpConfig {
  'amp.url'?: string
  [key: string]: unknown
}

export interface IntegrationStatus {
  configured: boolean
  configPath: string
  models?: string[]
}

// Phase A: Health Monitor Types
export const HEALTH_STATES = ['stopped', 'starting', 'healthy', 'degraded', 'unreachable', 'failed'] as const
export type HealthState = (typeof HEALTH_STATES)[number]

export interface HealthStatus {
  state: HealthState
  lastCheck: string | null
  consecutiveFailures: number
  restartAttempts: number
}

// Phase A: Provider Testing Types
export const PROVIDER_TEST_ERROR_CODES = [
  'PROXY_NOT_RUNNING',
  'TOKEN_EXPIRED',
  'QUOTA_EXCEEDED',
  'NETWORK_ERROR',
  'PROVIDER_ERROR',
  'TIMEOUT',
] as const
export type ProviderTestErrorCode = (typeof PROVIDER_TEST_ERROR_CODES)[number]

export interface ProviderTestResult {
  providerId: string
  success: boolean
  latencyMs?: number
  errorCode?: ProviderTestErrorCode
  errorMessage?: string
  timestamp: string
}

export interface ProviderTestRequest {
  providerId: string
  modelId?: string
}

// Phase A: Tool Integration Types
export interface ToolIntegration {
  toolId: string
  displayName: string
  detected: boolean
  configPath?: string
  configSnippet: string
  instructions: string
}

// Phase A: Log Manager Types
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  source?: string
  correlationId?: string
}

export interface LogsGetOptions {
  since?: string
  level?: LogLevel
  correlationId?: string
}

export interface LogVerbosityConfig {
  global: LogLevel
  components: Record<string, LogLevel>
}

// Phase B: Onboarding Types
export enum OnboardingStep {
  WELCOME = 0,
  ACQUISITION = 1,
  PROVIDERS = 2,
  CONNECT = 3,
  TOOLS = 4,
  TEST = 5,
  DONE = 6
}

export const ACQUISITION_SOURCES = [
  'search_engine',
  'blog_post',
  'setup_guide',
  'friend_colleague',
  'social_media',
  'other',
] as const
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]

export interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
}

export interface OnboardingState {
  completed: boolean
  currentStep: OnboardingStep
  selectedProviders: Provider[]
  selectedTools: string[]
  acquisitionSource?: AcquisitionSource
  acquisitionUtm?: UTMParams
  startedAt?: string
  completedAt?: string
}

export const AUTH_ERROR_CODES = [
  'TOKEN_EXPIRED',
  'AUTH_CANCELLED',
  'NETWORK_ERROR',
  'PROVIDER_ERROR',
  'INVALID_GRANT',
  'SCOPE_DENIED',
] as const
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export interface AuthError {
  code: AuthErrorCode
  message: string
  technicalMessage?: string
  retryable: boolean
  suggestedAction?: string
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, { message: string; action: string }> = {
  TOKEN_EXPIRED: { message: 'Your session has expired', action: 'Click to reconnect' },
  AUTH_CANCELLED: { message: 'Connection was cancelled', action: 'Try again when ready' },
  NETWORK_ERROR: { message: 'Connection failed', action: 'Check your internet' },
  PROVIDER_ERROR: { message: 'Provider is unavailable', action: 'Try again in a few minutes' },
  INVALID_GRANT: { message: 'Authorization was rejected', action: 'Reconnect your account' },
  SCOPE_DENIED: { message: 'Required permissions were not granted', action: 'Reconnect and allow all permissions' },
}

// Default models for provider testing
export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  claude: 'claude-sonnet-4-5-20250929',
  codex: 'gpt-5.1-codex',
  gemini: 'gemini-3-pro-preview',
  qwen: 'qwen-coder-plus-latest',
  iflow: 'deepseek-chat',
}

// Phase C: Request Types for Routing
export const REQUEST_TYPES = ['chat', 'completion', 'embedding', 'other'] as const
export type RequestType = (typeof REQUEST_TYPES)[number]

// Phase C: Selection Strategies for Provider Groups
export const SELECTION_STRATEGIES = ['round-robin', 'random', 'priority'] as const
export type SelectionStrategy = (typeof SELECTION_STRATEGIES)[number]

// Phase C: Profile Types
export interface Profile {
  id: string
  name: string
  color: string
  icon?: string
  routingRules: Record<RequestType, string | null> // requestType -> providerGroupId
  defaultProviderGroup: string | null
  createdAt: string
  updatedAt: string
}

// Phase C: Provider Group Types
export interface ProviderGroup {
  id: string
  name: string
  accountIds: string[]
  selectionStrategy: SelectionStrategy
}

// Phase C: Model Family Configuration
export interface ModelFamilies {
  chat: string[]
  completion: string[]
  embedding: string[]
}

// Phase C: Routing Config (shared with Go backend)
export interface RoutingConfig {
  version: number
  activeProfileId: string | null
  profiles: Profile[]
  providerGroups: ProviderGroup[]
  modelFamilies: ModelFamilies
}

// Phase C: IPC Channels for Profiles
export const PROFILE_IPC_CHANNELS = {
  PROFILE_LIST: 'profile:list',
  PROFILE_CREATE: 'profile:create',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_DELETE: 'profile:delete',
  PROFILE_SET_ACTIVE: 'profile:set-active',
  PROVIDER_GROUP_LIST: 'provider-group:list',
  PROVIDER_GROUP_CREATE: 'provider-group:create',
  PROVIDER_GROUP_UPDATE: 'provider-group:update',
  PROVIDER_GROUP_DELETE: 'provider-group:delete',
  CONFIG_SYNC: 'config:sync',
  METRICS_GET: 'metrics:get',
} as const

// Phase C: Metrics Types for Analytics
export interface MetricsSummary {
  totalRequests: number
  totalFailures: number
  avgLatencyMs: number
}

export interface ProviderMetrics {
  requests: number
  failures: number
  p50Ms: number
  p90Ms: number
  p99Ms: number
}

export interface TypeMetrics {
  requests: number
  failures: number
}

export interface DailyMetrics {
  date: string
  requests: number
  failures: number
  avgLatencyMs: number
}

export interface MetricsResponse {
  period: {
    from: string
    to: string
  }
  summary: MetricsSummary
  byProvider: Record<string, ProviderMetrics>
  byType: Record<RequestType, TypeMetrics>
  byProfile: Record<string, { requests: number }>
  daily: DailyMetrics[]
}

export interface MetricsQuery {
  from?: string
  to?: string
  granularity?: 'day' | 'hour'
}

// Device Sync Types
export type DeviceType = 'desktop' | 'laptop' | 'other'
export type DevicePlatform = 'darwin' | 'win32' | 'linux'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: DeviceType
  platform: DevicePlatform
  appVersion: string
}

// TG5: Feedback Types
export const FEEDBACK_CATEGORIES = ['bug', 'feature', 'general'] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export interface FeedbackSubmitRequest {
  category: FeedbackCategory
  message: string
  contactEmail?: string
  includeDiagnostics: boolean
}

export interface FeedbackContext {
  provider?: string
  model?: string
  appVersion: string
  platform: string
  os: string
}

export interface FeedbackLogEntry {
  level: string
  message: string
  timestamp: number
}

export interface FeedbackSubmitResponse {
  success: boolean
  error?: string
}

export interface SystemInfo {
  appVersion: string
  platform: string
  os: string
}

// TG3: Debug Bundle & Diagnostics Types
export interface DiagnosticsSystemInfo {
  platform: string
  arch: string
  osVersion: string
  nodeVersion?: string
  electronVersion?: string
}

export interface DiagnosticsProviderState {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'unknown'
  lastError?: string
  lastUsed?: string
}

export interface DiagnosticsMetrics {
  totalRequests: number
  successCount: number
  failureCount: number
  avgLatencyMs: number
  last24hRequests: number
}

export interface DebugBundle {
  version: string
  timestamp: string
  systemInfo: DiagnosticsSystemInfo
  config: Record<string, unknown>
  providers: DiagnosticsProviderState[]
  logs: LogEntry[]
  metrics: DiagnosticsMetrics | null
}

export interface RecentRequest {
  id: string
  timestamp: string
  provider: string
  model: string
  latencyMs: number
  status: 'success' | 'failure'
  correlationId: string
  errorCode?: string
  errorMessage?: string
}

export interface RecentRequestsFilter {
  status?: 'success' | 'failure' | 'all'
  correlationId?: string
  startTime?: string
  endTime?: string
  limit?: number
}

// TG5: Metrics Dashboard Types
export type MetricsTimeRange = '1d' | '7d'

export interface MetricsDashboardSummary {
  totalRequests: number
  totalFailures: number
  avgLatencyMs: number
  successRate: number
}

export interface MetricsProviderData {
  provider: string
  requests: number
  failures: number
  errorRate: number
  p50Ms: number
  p90Ms: number
  p99Ms: number
}

export interface MetricsDashboardResponse {
  summary: MetricsDashboardSummary
  byProvider: MetricsProviderData[]
  timeRange: MetricsTimeRange
}

export const METRICS_IPC_CHANNELS = {
  GET_SUMMARY: 'metrics:get-summary',
  GET_LATENCY_PERCENTILES: 'metrics:get-latency-percentiles',
  GET_REQUESTS_BY_PROVIDER: 'metrics:get-requests-by-provider',
  GET_ERROR_RATES: 'metrics:get-error-rates',
} as const
