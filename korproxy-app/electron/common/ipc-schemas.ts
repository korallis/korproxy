// IPC validation schemas - uses zod (main process only)

import { z } from 'zod'
import {
  PROVIDERS,
  type Settings,
  type Account,
  type ProxyStatus,
  type LogData,
  type OAuthResult,
  type TokenData,
  type UpdateStatus,
} from './ipc-types'

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

export const SettingsSchema: z.ZodSchema<Settings> = z.object({
  port: z.number().min(1).max(65535),
  autoStart: z.boolean(),
  minimizeToTray: z.boolean(),
  theme: ThemeSchema,
  windowBounds: WindowBoundsSchema.optional(),
})

export const ConfigContentSchema = z.string().max(1024 * 1024)

export const AccountIdSchema = z.string().min(1)

export const AccountSchema: z.ZodSchema<Account> = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  provider: ProviderSchema,
  enabled: z.boolean(),
  createdAt: z.string(),
  lastUsed: z.string().optional(),
})

export const ProxyStatusSchema: z.ZodSchema<ProxyStatus> = z.object({
  running: z.boolean(),
  port: z.number(),
})

export const LogDataSchema: z.ZodSchema<LogData> = z.object({
  type: z.enum(['stdout', 'stderr']),
  message: z.string(),
  timestamp: z.string().optional(),
})

export const OAuthResultSchema: z.ZodSchema<OAuthResult> = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  accountId: z.string().optional(),
})

export const TokenDataSchema: z.ZodSchema<TokenData> = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(),
  tokenType: z.string().default('Bearer'),
})

export const UpdateStatusSchema: z.ZodSchema<UpdateStatus> = z.object({
  status: z.enum(['checking', 'available', 'not-available', 'downloading', 'downloaded', 'error']),
  version: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
})

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
