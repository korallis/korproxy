export const CORRELATION_ID_HEADER = 'X-Correlation-ID'
export const CORRELATION_ID_LOG_KEY = 'correlationId'

export function generateCorrelationId(): string {
  return crypto.randomUUID()
}

export function extractCorrelationId(headers: Headers | Record<string, string>): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(CORRELATION_ID_HEADER) ?? undefined
  }
  return headers[CORRELATION_ID_HEADER] ?? headers[CORRELATION_ID_HEADER.toLowerCase()]
}

export function withCorrelationId(
  headers: Record<string, string>,
  correlationId?: string
): Record<string, string> {
  const id = correlationId ?? generateCorrelationId()
  return {
    ...headers,
    [CORRELATION_ID_HEADER]: id,
  }
}
