import { z } from 'zod'

export const IPC_CHANNELS = {
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
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export const PROVIDERS = ['gemini', 'claude', 'codex', 'qwen', 'iflow'] as const
export type Provider = (typeof PROVIDERS)[number]

export const ProviderSchema = z.enum(PROVIDERS)

export const SettingsKeySchema = z.enum([
  'port',
  'autoStart',
  'minimizeToTray',
  'theme',
  'windowBounds',
])

export const ThemeSchema = z.enum(['dark', 'light', 'system'])

export const WindowBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(400),
  height: z.number().min(300),
})

export const SettingsSchema = z.object({
  port: z.number().min(1).max(65535),
  autoStart: z.boolean(),
  minimizeToTray: z.boolean(),
  theme: ThemeSchema,
  windowBounds: WindowBoundsSchema.optional(),
})

export type Settings = z.infer<typeof SettingsSchema>

export const ConfigContentSchema = z.string().max(1024 * 1024)

export const AccountIdSchema = z.string().uuid()

export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  provider: ProviderSchema,
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
})

export type Account = z.infer<typeof AccountSchema>

export const ProxyStatusSchema = z.object({
  running: z.boolean(),
  port: z.number(),
})

export type ProxyStatus = z.infer<typeof ProxyStatusSchema>

export const LogDataSchema = z.object({
  type: z.enum(['stdout', 'stderr']),
  message: z.string(),
  timestamp: z.string().datetime().optional(),
})

export type LogData = z.infer<typeof LogDataSchema>

export const OAuthResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  accountId: z.string().uuid().optional(),
})

export type OAuthResult = z.infer<typeof OAuthResultSchema>

export const TokenDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(),
  tokenType: z.string().default('Bearer'),
})

export type TokenData = z.infer<typeof TokenDataSchema>

export const UpdateStatusSchema = z.object({
  status: z.enum(['checking', 'available', 'not-available', 'downloading', 'downloaded', 'error']),
  version: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
})

export type UpdateStatus = z.infer<typeof UpdateStatusSchema>

export class IpcValidationError extends Error {
  constructor(
    public channel: string,
    public issues: z.ZodIssue[]
  ) {
    super(`IPC validation failed for ${channel}: ${issues.map((i) => i.message).join(', ')}`)
    this.name = 'IpcValidationError'
  }
}

export function validateIpcPayload<T>(
  channel: string,
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new IpcValidationError(channel, result.error.issues)
  }
  return result.data
}
