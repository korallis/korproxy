export enum ErrorCategory {
  AUTH = 'AUTH',
  PROV = 'PROV',
  CONF = 'CONF',
  NET = 'NET',
  RATE = 'RATE',
  SYS = 'SYS',
}

export enum ErrorSeverity {
  Critical = 'critical',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface KorProxyError {
  code: string
  message: string
  description: string
  troubleshooting: string[]
  severity: ErrorSeverity
  httpStatus: number
}

export type ErrorCode =
  | 'KP-AUTH-001'
  | 'KP-AUTH-002'
  | 'KP-AUTH-003'
  | 'KP-PROV-101'
  | 'KP-PROV-102'
  | 'KP-PROV-103'
  | 'KP-CONF-201'
  | 'KP-CONF-202'
  | 'KP-CONF-203'
  | 'KP-NET-301'
  | 'KP-NET-302'
  | 'KP-NET-303'
  | 'KP-RATE-401'
  | 'KP-RATE-402'
  | 'KP-RATE-403'
  | 'KP-SYS-501'
  | 'KP-SYS-502'
  | 'KP-SYS-503'

export const ERROR_REGISTRY: Record<ErrorCode, KorProxyError> = {
  'KP-AUTH-001': {
    code: 'KP-AUTH-001',
    message: 'Invalid credentials',
    description: 'The provided credentials are invalid or have been revoked.',
    troubleshooting: [
      'Verify your account credentials are correct',
      'Re-authenticate with the provider',
      'Check if your subscription is still active',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 401,
  },
  'KP-AUTH-002': {
    code: 'KP-AUTH-002',
    message: 'Token expired',
    description: 'The authentication token has expired and needs to be refreshed.',
    troubleshooting: [
      'Click the refresh button to renew your session',
      'Re-authenticate if refresh fails',
      'Check your system clock is accurate',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 401,
  },
  'KP-AUTH-003': {
    code: 'KP-AUTH-003',
    message: 'OAuth failed',
    description: 'The OAuth authentication flow failed to complete.',
    troubleshooting: [
      'Ensure you completed the authentication in your browser',
      'Check your internet connection',
      'Try disabling browser extensions that may interfere',
      'Clear browser cookies and try again',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 401,
  },
  'KP-PROV-101': {
    code: 'KP-PROV-101',
    message: 'Provider unavailable',
    description: 'The AI provider service is currently unavailable.',
    troubleshooting: [
      'Check the provider status page for outages',
      'Wait a few minutes and try again',
      'Switch to an alternate provider if available',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 502,
  },
  'KP-PROV-102': {
    code: 'KP-PROV-102',
    message: 'Invalid response',
    description: 'The provider returned an unexpected or malformed response.',
    troubleshooting: [
      'Retry the request',
      'Check if the model ID is correct',
      'Report this issue if it persists',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 502,
  },
  'KP-PROV-103': {
    code: 'KP-PROV-103',
    message: 'Unsupported model',
    description: 'The requested model is not supported by the provider or your subscription.',
    troubleshooting: [
      'Check available models in your subscription',
      'Verify the model ID spelling',
      'Upgrade your subscription if required',
    ],
    severity: ErrorSeverity.Warning,
    httpStatus: 502,
  },
  'KP-CONF-201': {
    code: 'KP-CONF-201',
    message: 'Invalid configuration',
    description: 'The configuration file contains invalid settings.',
    troubleshooting: [
      'Review recent configuration changes',
      'Reset to default configuration',
      'Check configuration file syntax',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 400,
  },
  'KP-CONF-202': {
    code: 'KP-CONF-202',
    message: 'Missing required field',
    description: 'A required configuration field is missing.',
    troubleshooting: [
      'Check the error details for the missing field name',
      'Add the required field to your configuration',
      'Refer to documentation for required fields',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 400,
  },
  'KP-CONF-203': {
    code: 'KP-CONF-203',
    message: 'Schema validation failed',
    description: 'The configuration does not match the expected schema.',
    troubleshooting: [
      'Validate your configuration against the schema',
      'Check field types match expected types',
      'Remove any unknown or deprecated fields',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 400,
  },
  'KP-NET-301': {
    code: 'KP-NET-301',
    message: 'Connection refused',
    description: 'The connection to the server was refused.',
    troubleshooting: [
      'Check if the proxy server is running',
      'Verify the port number is correct',
      'Check firewall settings',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 503,
  },
  'KP-NET-302': {
    code: 'KP-NET-302',
    message: 'Request timeout',
    description: 'The request timed out waiting for a response.',
    troubleshooting: [
      'Check your internet connection',
      'The provider may be experiencing high load',
      'Try again with a simpler request',
    ],
    severity: ErrorSeverity.Warning,
    httpStatus: 503,
  },
  'KP-NET-303': {
    code: 'KP-NET-303',
    message: 'DNS resolution failed',
    description: 'Unable to resolve the server hostname.',
    troubleshooting: [
      'Check your internet connection',
      'Verify DNS settings',
      'Try using a different DNS server',
    ],
    severity: ErrorSeverity.Error,
    httpStatus: 503,
  },
  'KP-RATE-401': {
    code: 'KP-RATE-401',
    message: 'Rate limited',
    description: 'You have exceeded the rate limit for requests.',
    troubleshooting: [
      'Wait before making more requests',
      'Reduce request frequency',
      'Check your subscription rate limits',
    ],
    severity: ErrorSeverity.Warning,
    httpStatus: 429,
  },
  'KP-RATE-402': {
    code: 'KP-RATE-402',
    message: 'Quota exceeded',
    description: 'You have exceeded your usage quota.',
    troubleshooting: [
      'Check your subscription usage',
      'Wait for quota reset (usually monthly)',
      'Upgrade your subscription for higher limits',
    ],
    severity: ErrorSeverity.Warning,
    httpStatus: 429,
  },
  'KP-RATE-403': {
    code: 'KP-RATE-403',
    message: 'Concurrent request limit',
    description: 'Too many concurrent requests in progress.',
    troubleshooting: [
      'Wait for pending requests to complete',
      'Reduce parallelism in your application',
      'Queue requests to avoid concurrent limits',
    ],
    severity: ErrorSeverity.Warning,
    httpStatus: 429,
  },
  'KP-SYS-501': {
    code: 'KP-SYS-501',
    message: 'Internal error',
    description: 'An unexpected internal error occurred.',
    troubleshooting: [
      'Restart the KorProxy application',
      'Check application logs for details',
      'Report this issue with logs attached',
    ],
    severity: ErrorSeverity.Critical,
    httpStatus: 500,
  },
  'KP-SYS-502': {
    code: 'KP-SYS-502',
    message: 'Out of memory',
    description: 'The application has run out of available memory.',
    troubleshooting: [
      'Close other applications to free memory',
      'Restart the KorProxy application',
      'Increase system memory if issue persists',
    ],
    severity: ErrorSeverity.Critical,
    httpStatus: 500,
  },
  'KP-SYS-503': {
    code: 'KP-SYS-503',
    message: 'Disk full',
    description: 'Insufficient disk space available.',
    troubleshooting: [
      'Free up disk space',
      'Clear application cache and logs',
      'Move data to another drive',
    ],
    severity: ErrorSeverity.Critical,
    httpStatus: 500,
  },
}

const ERROR_CODE_PATTERN = /^KP-(AUTH|PROV|CONF|NET|RATE|SYS)-\d{3}$/

export function getError(code: string): KorProxyError | undefined {
  return ERROR_REGISTRY[code as ErrorCode]
}

export function formatError(error: KorProxyError): string {
  return `[${error.code}] ${error.message}: ${error.description}`
}

export function isKorProxyError(obj: unknown): obj is KorProxyError {
  if (!obj || typeof obj !== 'object') return false
  const candidate = obj as Record<string, unknown>
  if (typeof candidate.code !== 'string') return false
  if (!ERROR_CODE_PATTERN.test(candidate.code)) return false
  return (
    typeof candidate.message === 'string' &&
    typeof candidate.description === 'string' &&
    Array.isArray(candidate.troubleshooting) &&
    typeof candidate.severity === 'string' &&
    typeof candidate.httpStatus === 'number'
  )
}

export function getErrorsByCategory(category: ErrorCategory): KorProxyError[] {
  return Object.values(ERROR_REGISTRY).filter((e) => e.code.includes(`-${category}-`))
}

export function getErrorsBySeverity(severity: ErrorSeverity): KorProxyError[] {
  return Object.values(ERROR_REGISTRY).filter((e) => e.severity === severity)
}

export function createErrorResponse(code: ErrorCode, details?: string): KorProxyError & { details?: string } {
  const error = ERROR_REGISTRY[code]
  return details ? { ...error, details } : error
}
