// IPC validation schemas - uses zod (main process only)

import { z } from 'zod'
import {
  PROVIDERS,
  HEALTH_STATES,
  PROVIDER_TEST_ERROR_CODES,
  LOG_LEVELS,
  AUTH_ERROR_CODES,
  REQUEST_TYPES,
  SELECTION_STRATEGIES,
  FEEDBACK_CATEGORIES,
  OnboardingStep,
  type Settings,
  type Account,
  type ProxyStatus,
  type LogData,
  type OAuthResult,
  type TokenData,
  type UpdateStatus,
  type HealthStatus,
  type ProviderTestResult,
  type ProviderTestRequest,
  type ToolIntegration,
  type OnboardingState,
  type AuthError,
  type Profile,
  type ProviderGroup,
  type ModelFamilies,
  type RoutingConfig,
  type MetricsSummary,
  type ProviderMetrics,
  type TypeMetrics,
  type DailyMetrics,
  type MetricsResponse,
  type MetricsQuery,
  type DeviceInfo,
  type FeedbackSubmitRequest,
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

// Phase A: Health Monitor Schemas
export const HealthStateSchema = z.enum(HEALTH_STATES)

export const HealthStatusSchema: z.ZodSchema<HealthStatus> = z.object({
  state: HealthStateSchema,
  lastCheck: z.string().nullable(),
  consecutiveFailures: z.number().min(0),
  restartAttempts: z.number().min(0),
})

// Phase A: Provider Testing Schemas
export const ProviderTestErrorCodeSchema = z.enum(PROVIDER_TEST_ERROR_CODES)

export const ProviderTestResultSchema: z.ZodSchema<ProviderTestResult> = z.object({
  providerId: z.string(),
  success: z.boolean(),
  latencyMs: z.number().optional(),
  errorCode: ProviderTestErrorCodeSchema.optional(),
  errorMessage: z.string().optional(),
  timestamp: z.string(),
})

export const ProviderTestRequestSchema: z.ZodSchema<ProviderTestRequest> = z.object({
  providerId: z.string(),
  modelId: z.string().optional(),
})

// Phase A: Tool Integration Schemas
export const ToolIntegrationSchema: z.ZodSchema<ToolIntegration> = z.object({
  toolId: z.string(),
  displayName: z.string(),
  detected: z.boolean(),
  configPath: z.string().optional(),
  configSnippet: z.string(),
  instructions: z.string(),
})

// Phase A: Log Manager Schemas
export const LogLevelSchema = z.enum(LOG_LEVELS)

export const LogEntrySchema = z.object({
  timestamp: z.string(),
  level: LogLevelSchema,
  message: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
})

export const LogsGetOptionsSchema = z.object({
  since: z.string().optional(),
  level: LogLevelSchema.optional(),
})

// Phase B: Onboarding Schemas
export const OnboardingStepSchema = z.nativeEnum(OnboardingStep)

export const OnboardingStateSchema: z.ZodSchema<OnboardingState> = z.object({
  completed: z.boolean(),
  currentStep: OnboardingStepSchema,
  selectedProviders: z.array(ProviderSchema),
  selectedTools: z.array(z.string()),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})

// Phase B: Auth Error Schemas
export const AuthErrorCodeSchema = z.enum(AUTH_ERROR_CODES)

export const AuthErrorSchema: z.ZodSchema<AuthError> = z.object({
  code: AuthErrorCodeSchema,
  message: z.string(),
  technicalMessage: z.string().optional(),
  retryable: z.boolean(),
  suggestedAction: z.string().optional(),
})

// Phase C: Routing & Profile Schemas
export const RequestTypeSchema = z.enum(REQUEST_TYPES)
export const SelectionStrategySchema = z.enum(SELECTION_STRATEGIES)

export const RoutingRulesSchema = z.object({
  chat: z.string().nullable(),
  completion: z.string().nullable(),
  embedding: z.string().nullable(),
  other: z.string().nullable(),
})

export const ProfileSchema: z.ZodSchema<Profile> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  routingRules: RoutingRulesSchema,
  defaultProviderGroup: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ProviderGroupSchema: z.ZodSchema<ProviderGroup> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  accountIds: z.array(z.string()),
  selectionStrategy: SelectionStrategySchema,
})

export const ModelFamiliesSchema: z.ZodSchema<ModelFamilies> = z.object({
  chat: z.array(z.string()),
  completion: z.array(z.string()),
  embedding: z.array(z.string()),
})

export const RoutingConfigSchema: z.ZodSchema<RoutingConfig> = z.object({
  version: z.number().int().min(1),
  activeProfileId: z.string().uuid().nullable(),
  profiles: z.array(ProfileSchema),
  providerGroups: z.array(ProviderGroupSchema),
  modelFamilies: ModelFamiliesSchema,
})

// Phase C: Metrics Schemas
export const MetricsSummarySchema: z.ZodSchema<MetricsSummary> = z.object({
  totalRequests: z.number().int().min(0),
  totalFailures: z.number().int().min(0),
  avgLatencyMs: z.number().min(0),
})

export const ProviderMetricsSchema: z.ZodSchema<ProviderMetrics> = z.object({
  requests: z.number().int().min(0),
  failures: z.number().int().min(0),
  p50Ms: z.number().min(0),
  p90Ms: z.number().min(0),
  p99Ms: z.number().min(0),
})

export const TypeMetricsSchema: z.ZodSchema<TypeMetrics> = z.object({
  requests: z.number().int().min(0),
  failures: z.number().int().min(0),
})

export const DailyMetricsSchema: z.ZodSchema<DailyMetrics> = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requests: z.number().int().min(0),
  failures: z.number().int().min(0),
  avgLatencyMs: z.number().min(0),
})

export const MetricsResponseSchema: z.ZodSchema<MetricsResponse> = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  summary: MetricsSummarySchema,
  byProvider: z.record(z.string(), ProviderMetricsSchema),
  byType: z.record(RequestTypeSchema, TypeMetricsSchema),
  byProfile: z.record(z.string(), z.object({ requests: z.number().int().min(0) })),
  daily: z.array(DailyMetricsSchema),
})

export const MetricsQuerySchema: z.ZodSchema<MetricsQuery> = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  granularity: z.enum(['day', 'hour']).optional(),
})

// Profile creation/update input schemas (without auto-generated fields)
export const ProfileCreateInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  routingRules: RoutingRulesSchema.optional(),
  defaultProviderGroup: z.string().uuid().nullable().optional(),
})

export const ProfileUpdateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  routingRules: RoutingRulesSchema.optional(),
  defaultProviderGroup: z.string().uuid().nullable().optional(),
})

export const ProviderGroupCreateInputSchema = z.object({
  name: z.string().min(1).max(100),
  accountIds: z.array(z.string()).optional(),
  selectionStrategy: SelectionStrategySchema.optional(),
})

export const ProviderGroupUpdateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  accountIds: z.array(z.string()).optional(),
  selectionStrategy: SelectionStrategySchema.optional(),
})

// Device Sync Schemas
export const DeviceTypeSchema = z.enum(['desktop', 'laptop', 'other'])
export const DevicePlatformSchema = z.enum(['darwin', 'win32', 'linux'])

export const DeviceInfoSchema: z.ZodSchema<DeviceInfo> = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(255),
  deviceType: DeviceTypeSchema,
  platform: DevicePlatformSchema,
  appVersion: z.string().min(1),
})

export const DeviceRegisterRequestSchema = z.object({
  token: z.string().min(1),
  deviceInfo: DeviceInfoSchema,
})

export const DeviceUpdateLastSeenRequestSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().uuid(),
})

// TG5: Feedback Schemas
export const FeedbackCategorySchema = z.enum(FEEDBACK_CATEGORIES)

export const FeedbackSubmitRequestSchema: z.ZodSchema<FeedbackSubmitRequest> = z.object({
  category: FeedbackCategorySchema,
  message: z.string().min(1).max(5000),
  contactEmail: z.string().email().optional(),
  includeDiagnostics: z.boolean(),
})
