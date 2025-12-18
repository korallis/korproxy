// Re-export all types from ipc-types for renderer use
export type {
  ProxyStatus,
  LogData,
  Settings,
  Account,
  OAuthResult,
  TokenData,
  UpdateStatus,
  Provider,
  ProxyStats,
  FactoryCustomModel,
  FactoryConfig,
  AmpConfig,
  IntegrationStatus,
  HealthStatus,
  ProviderTestResult,
  ToolIntegration,
  LogEntry,
  LogsGetOptions,
  OnboardingState,
  AuthError,
  AuthErrorCode,
  AcquisitionSource,
  UTMParams,
} from '../../electron/common/ipc-types'

export {
  OnboardingStep,
  AUTH_ERROR_MESSAGES,
  ACQUISITION_SOURCES,
} from '../../electron/common/ipc-types'

// Re-export entitlement types
export type {
  Plan,
  EntitlementScope,
  EntitlementStatus,
  PlanLimits,
  Entitlements,
  TeamRole,
  TeamMemberStatus,
  InviteStatus,
  TeamSubscriptionStatus,
  Team,
  TeamMember,
  TeamInvite,
  Device,
} from './entitlements'

export {
  PLAN_LIMITS,
  DEFAULT_ENTITLEMENTS,
  EntitlementsSchema,
  GRACE_PERIOD_PAST_DUE_DAYS,
  GRACE_PERIOD_OFFLINE_HOURS,
} from './entitlements'

// Re-export the ProxyLog interface
export interface ProxyLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  provider?: string
  model?: string
  tokens?: number
}

// Re-export types from the .d.ts declaration file
export type { KorProxyAPI } from './electron.d'

// Ensure Window augmentation is applied
import './electron.d'
