# API Gateway/Proxy Best Practices Guide

Comprehensive guide for implementing correlation IDs, structured logging, rate limiting, metrics, and request pools in API gateway/proxy systems.

---

## Table of Contents

1. [Correlation IDs & Request Tracing](#1-correlation-ids--request-tracing)
2. [Structured Logging](#2-structured-logging)
3. [Rate Limiting](#3-rate-limiting)
4. [Metrics & Observability](#4-metrics--observability)
5. [HTTP Connection Pooling](#5-http-connection-pooling)
6. [Implementation Location: Edge vs UI](#6-implementation-location-edge-vs-ui)
7. [Common Pitfalls](#7-common-pitfalls)

---

## 1. Correlation IDs & Request Tracing

### What Are Correlation IDs?

Correlation IDs (also called Request IDs or Trace IDs) are unique identifiers that track a request through your entire system, from entry point through all microservices and back.

### Best Practices

#### 1.1 Header Naming Standards

Use industry-standard header names:

```
Primary: X-Request-ID (most common)
Alternative: X-Correlation-ID
Distributed Tracing: traceparent (W3C Trace Context standard)
Legacy: X-B3-TraceId, X-B3-SpanId (Zipkin format)
```

**Recommendation:** Support multiple headers for compatibility:

```typescript
// Priority order for extracting correlation ID
const CORRELATION_HEADERS = [
  'traceparent',        // W3C standard (preferred)
  'x-request-id',       // Most common
  'x-correlation-id',   // Alternative
  'x-trace-id',         // Custom
];

function extractCorrelationId(headers: Headers): string {
  for (const header of CORRELATION_HEADERS) {
    const value = headers.get(header);
    if (value) return value;
  }
  return generateCorrelationId();
}
```

#### 1.2 ID Generation

**Format Options:**

```typescript
// UUID v4 (most common, 36 chars)
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4(); // "550e8400-e29b-41d4-a716-446655440000"

// ULID (sortable, 26 chars, better for databases)
import { ulid } from 'ulid';
const id = ulid(); // "01ARZ3NDEKTSV4RRFFQ69G5FAV"

// Nano ID (shorter, URL-safe, 21 chars)
import { nanoid } from 'nanoid';
const id = nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
```

**Recommendation:** Use UUIDs for maximum compatibility, ULIDs if you need sortability.

#### 1.3 Middleware Implementation

**Go Example:**

```go
package middleware

import (
    "context"
    "net/http"
    "github.com/google/uuid"
)

const (
    RequestIDHeader = "X-Request-ID"
    RequestIDKey    = "request_id"
)

func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Try to extract from incoming request
        requestID := r.Header.Get(RequestIDHeader)
        
        // Generate if not present
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        // Add to response headers (important for clients)
        w.Header().Set(RequestIDHeader, requestID)
        
        // Add to request context for downstream use
        ctx := context.WithValue(r.Context(), RequestIDKey, requestID)
        
        // Continue with updated context
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Helper to extract from context
func GetRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(RequestIDKey).(string); ok {
        return id
    }
    return ""
}
```

**TypeScript/Node.js Example:**

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_HEADER = 'X-Request-ID';

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract or generate
  const correlationId = 
    req.get(CORRELATION_ID_HEADER) || 
    req.get('X-Correlation-ID') ||
    uuidv4();
  
  // Store in request for easy access
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}
```

#### 1.4 Propagation to Downstream Services

**Always propagate correlation IDs:**

```typescript
// Bad: No correlation ID propagation
const response = await fetch('https://api.example.com/users');

// Good: Propagate correlation ID
const response = await fetch('https://api.example.com/users', {
  headers: {
    'X-Request-ID': req.correlationId,
  },
});
```

**Go HTTP Client with Correlation ID:**

```go
func makeRequest(ctx context.Context, url string) (*http.Response, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    // Propagate correlation ID from context
    if requestID := GetRequestID(ctx); requestID != "" {
        req.Header.Set("X-Request-ID", requestID)
    }
    
    return http.DefaultClient.Do(req)
}
```

#### 1.5 W3C Trace Context Standard

For distributed tracing compatibility:

```typescript
// Parse W3C traceparent header
// Format: 00-{trace-id}-{parent-id}-{flags}
function parseTraceParent(header: string): {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
} | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;
  
  return {
    version: parts[0],
    traceId: parts[1],
    parentId: parts[2],
    flags: parts[3],
  };
}

// Generate traceparent header
function generateTraceParent(traceId?: string): string {
  const version = '00';
  const trace = traceId || generateHex(32); // 32 hex chars
  const parent = generateHex(16); // 16 hex chars
  const flags = '01'; // sampled
  
  return `${version}-${trace}-${parent}-${flags}`;
}
```

---

## 2. Structured Logging

### Why Structured Logging?

- **Searchable:** Query logs by specific fields
- **Parseable:** Machine-readable JSON format
- **Contextual:** Automatic inclusion of correlation IDs, user IDs, etc.
- **Aggregatable:** Easy to analyze in log aggregation tools

### Best Practices

#### 2.1 Log Format

**Use JSON for production:**

```json
{
  "timestamp": "2025-12-18T18:49:37.123Z",
  "level": "info",
  "message": "User login successful",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_123",
  "ip_address": "192.168.1.1",
  "duration_ms": 145,
  "service": "auth-service",
  "environment": "production"
}
```

#### 2.2 Logger Configuration

**Go with Zerolog:**

```go
package logger

import (
    "context"
    "os"
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func Init() {
    // Pretty print for development
    if os.Getenv("ENV") == "development" {
        log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
    }
    
    // Set global level
    zerolog.SetGlobalLevel(zerolog.InfoLevel)
    
    // Add default fields
    log.Logger = log.With().
        Str("service", "api-gateway").
        Str("version", "1.0.0").
        Logger()
}

// Create logger with correlation ID from context
func FromContext(ctx context.Context) *zerolog.Logger {
    logger := log.With().Logger()
    
    if requestID := GetRequestID(ctx); requestID != "" {
        logger = logger.With().Str("correlation_id", requestID).Logger()
    }
    
    return &logger
}

// Usage
func HandleRequest(ctx context.Context) {
    logger := FromContext(ctx)
    logger.Info().
        Str("user_id", "user_123").
        Int("status_code", 200).
        Msg("Request processed successfully")
}
```

**TypeScript with Pino:**

```typescript
import pino from 'pino';

// Create base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'api-gateway',
    environment: process.env.NODE_ENV,
  },
});

// Create child logger with correlation ID
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlation_id: correlationId });
}

// Usage in middleware
app.use((req, res, next) => {
  req.log = createRequestLogger(req.correlationId);
  
  req.log.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  }, 'Incoming request');
  
  next();
});

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      log: pino.Logger;
    }
  }
}
```

#### 2.3 What to Log

**DO Log:**

```typescript
// Request/Response lifecycle
logger.info({
  method: 'POST',
  path: '/api/users',
  status_code: 201,
  duration_ms: 145,
  user_id: 'user_123',
}, 'Request completed');

// Business events
logger.info({
  event: 'user_registered',
  user_id: 'user_123',
  email: 'user@example.com',
}, 'New user registered');

// Errors with context
logger.error({
  error: err.message,
  stack: err.stack,
  user_id: 'user_123',
  operation: 'create_order',
}, 'Failed to create order');

// Performance issues
logger.warn({
  duration_ms: 5000,
  threshold_ms: 1000,
  query: 'SELECT * FROM users',
}, 'Slow database query detected');
```

**DON'T Log:**

```typescript
// ❌ Sensitive data
logger.info({ password: 'secret123' }); // NO!
logger.info({ credit_card: '4111-1111-1111-1111' }); // NO!
logger.info({ api_key: 'sk_live_...' }); // NO!

// ❌ Excessive detail in production
logger.debug({ full_request_body: largeObject }); // Use sparingly

// ❌ Unstructured messages
logger.info('User user_123 logged in at 2025-12-18'); // Use fields instead
```

#### 2.4 Log Levels

```
ERROR   - System errors, failures requiring immediate attention
WARN    - Degraded performance, approaching limits, recoverable errors
INFO    - Normal business events, request lifecycle
DEBUG   - Detailed diagnostic information (development only)
TRACE   - Very detailed diagnostic information (rarely used)
```

**Level Selection:**

```typescript
// ERROR: System cannot function
logger.error({ error: err }, 'Database connection failed');

// WARN: System degraded but functional
logger.warn({ 
  rate_limit_remaining: 10,
  rate_limit_total: 1000,
}, 'Rate limit approaching threshold');

// INFO: Normal operations
logger.info({ user_id }, 'User logged in');

// DEBUG: Development diagnostics
logger.debug({ query, params }, 'Executing database query');
```

#### 2.5 Redacting Sensitive Data

```typescript
import pino from 'pino';

const logger = pino({
  redact: {
    paths: [
      'password',
      'api_key',
      'authorization',
      'credit_card',
      '*.password',
      'headers.authorization',
    ],
    censor: '[REDACTED]',
  },
});

// This will automatically redact sensitive fields
logger.info({
  user: {
    email: 'user@example.com',
    password: 'secret123', // Will be [REDACTED]
  },
});
```

---

## 3. Rate Limiting

### Rate Limiting Algorithms

#### 3.1 Token Bucket (Recommended)

**Best for:** Allowing bursts while maintaining average rate.

**How it works:**
- Bucket holds tokens (capacity)
- Tokens refill at constant rate
- Each request consumes tokens
- Request allowed if tokens available

**Implementation:**

```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
  
  getTimeUntilNextToken(): number {
    if (this.tokens >= 1) return 0;
    return ((1 - this.tokens) / this.refillRate) * 1000;
  }
}

// Usage
const bucket = new TokenBucket(100, 10); // 100 capacity, 10/sec refill

if (bucket.consume(1)) {
  // Process request
} else {
  const retryAfter = Math.ceil(bucket.getTimeUntilNextToken() / 1000);
  res.status(429).header('Retry-After', retryAfter.toString());
}
```

**Go Implementation:**

```go
package ratelimit

import (
    "sync"
    "time"
)

type TokenBucket struct {
    capacity     int64
    tokens       int64
    refillRate   int64 // tokens per second
    lastRefill   time.Time
    mu           sync.Mutex
}

func NewTokenBucket(capacity, refillRate int64) *TokenBucket {
    return &TokenBucket{
        capacity:   capacity,
        tokens:     capacity,
        refillRate: refillRate,
        lastRefill: time.Now(),
    }
}

func (tb *TokenBucket) refill() {
    now := time.Now()
    elapsed := now.Sub(tb.lastRefill).Seconds()
    tokensToAdd := int64(elapsed * float64(tb.refillRate))
    
    tb.tokens = min(tb.capacity, tb.tokens+tokensToAdd)
    tb.lastRefill = now
}

func (tb *TokenBucket) Consume(tokens int64) bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()
    
    tb.refill()
    
    if tb.tokens >= tokens {
        tb.tokens -= tokens
        return true
    }
    
    return false
}

func min(a, b int64) int64 {
    if a < b {
        return a
    }
    return b
}
```

#### 3.2 Sliding Window Log

**Best for:** Precise rate limiting with exact request counting.

**How it works:**
- Store timestamp of each request
- Count requests in sliding time window
- Remove old requests outside window

```typescript
class SlidingWindowLog {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];
    
    // Remove requests outside window
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check if under limit
    if (timestamps.length < this.limit) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
      return true;
    }
    
    return false;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.requests.get(key) || [];
    const validRequests = timestamps.filter(ts => ts > windowStart);
    
    return Math.max(0, this.limit - validRequests.length);
  }
}

// Usage
const limiter = new SlidingWindowLog(100, 60000); // 100 req/min

if (limiter.isAllowed(userId)) {
  // Process request
} else {
  res.status(429).json({ error: 'Rate limit exceeded' });
}
```

#### 3.3 Distributed Rate Limiting with Redis

**For multi-instance deployments:**

```typescript
import Redis from 'ioredis';

class RedisTokenBucket {
  constructor(
    private redis: Redis,
    private capacity: number,
    private refillRate: number,
  ) {}
  
  async consume(key: string, tokens: number = 1): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
  }> {
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local tokens = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local currentTokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate refill
      local elapsed = (now - lastRefill) / 1000
      local tokensToAdd = math.floor(elapsed * refillRate)
      currentTokens = math.min(capacity, currentTokens + tokensToAdd)
      
      local allowed = 0
      local retryAfter = 0
      
      if currentTokens >= tokens then
        currentTokens = currentTokens - tokens
        allowed = 1
      else
        retryAfter = math.ceil((tokens - currentTokens) / refillRate)
      end
      
      -- Update bucket
      redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)
      
      return {allowed, currentTokens, retryAfter}
    `;
    
    const result = await this.redis.eval(
      script,
      1,
      `ratelimit:${key}`,
      this.capacity,
      this.refillRate,
      tokens,
      Date.now(),
    ) as [number, number, number];
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfter: result[2] > 0 ? result[2] : undefined,
    };
  }
}

// Usage
const limiter = new RedisTokenBucket(redis, 100, 10);

app.use(async (req, res, next) => {
  const key = req.ip; // or req.user.id
  const result = await limiter.consume(key);
  
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter!.toString());
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
});
```

#### 3.4 Rate Limit Response Headers

**Standard headers:**

```
X-RateLimit-Limit: 100          # Total requests allowed
X-RateLimit-Remaining: 42       # Requests remaining
X-RateLimit-Reset: 1640000000   # Unix timestamp when limit resets
Retry-After: 60                 # Seconds until retry (on 429)
```

**Implementation:**

```typescript
function setRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetTime: number,
): void {
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetTime.toString());
}

// On rate limit exceeded
res.setHeader('Retry-After', retryAfterSeconds.toString());
res.status(429).json({
  error: 'Too Many Requests',
  message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
});
```

#### 3.5 Multi-Tier Rate Limiting

**Different limits for different user tiers:**

```typescript
interface RateLimitTier {
  requestsPerMinute: number;
  burstCapacity: number;
}

const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  free: { requestsPerMinute: 60, burstCapacity: 10 },
  pro: { requestsPerMinute: 600, burstCapacity: 100 },
  enterprise: { requestsPerMinute: 6000, burstCapacity: 1000 },
};

async function getRateLimitForUser(userId: string): Promise<RateLimitTier> {
  const user = await db.users.findById(userId);
  return RATE_LIMIT_TIERS[user.tier] || RATE_LIMIT_TIERS.free;
}

app.use(async (req, res, next) => {
  const tier = await getRateLimitForUser(req.user.id);
  const limiter = new TokenBucket(
    tier.burstCapacity,
    tier.requestsPerMinute / 60,
  );
  
  // ... rate limiting logic
});
```

---

## 4. Metrics & Observability

### Best Practices

#### 4.1 Prometheus Metrics

**Key metric types:**

```
Counter   - Monotonically increasing (requests, errors)
Gauge     - Current value (active connections, memory)
Histogram - Distribution (request duration, response size)
Summary   - Similar to histogram, with quantiles
```

**Go Implementation:**

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Counter: Total requests
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    // Histogram: Request duration
    httpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets, // or custom: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10}
        },
        []string{"method", "path"},
    )
    
    // Gauge: Active connections
    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_active_connections",
            Help: "Number of active HTTP connections",
        },
    )
    
    // Counter: Rate limit hits
    rateLimitHits = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "rate_limit_hits_total",
            Help: "Total number of rate limit hits",
        },
        []string{"user_tier"},
    )
)

// Middleware
func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Track active connections
        activeConnections.Inc()
        defer activeConnections.Dec()
        
        // Wrap response writer to capture status
        wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(wrapped, r)
        
        // Record metrics
        duration := time.Since(start).Seconds()
        httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
        httpRequestsTotal.WithLabelValues(
            r.Method,
            r.URL.Path,
            strconv.Itoa(wrapped.statusCode),
        ).Inc()
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}
```

**TypeScript Implementation:**

```typescript
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

// Middleware
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();
    
    activeConnections.dec();
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### 4.2 Custom Business Metrics

```typescript
// Track specific business events
const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['source', 'tier'],
});

const orderValue = new Histogram({
  name: 'order_value_dollars',
  help: 'Order value in dollars',
  labelNames: ['product_category'],
  buckets: [10, 50, 100, 500, 1000, 5000],
});

const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
});

// Usage
userRegistrations.labels('web', 'free').inc();
orderValue.labels('electronics').observe(299.99);
cacheHitRate.set(calculateHitRate());
```

#### 4.3 Health Check Endpoints

```typescript
// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase(): Promise<{ healthy: boolean; latency?: number }> {
  try {
    const start = Date.now();
    await db.raw('SELECT 1');
    return { healthy: true, latency: Date.now() - start };
  } catch (error) {
    return { healthy: false };
  }
}
```

---

## 5. HTTP Connection Pooling

### Why Connection Pooling?

- **Performance:** Reuse TCP connections, avoid handshake overhead
- **Resource efficiency:** Limit concurrent connections
- **Stability:** Prevent connection exhaustion

### Best Practices

#### 5.1 Go HTTP Client Configuration

```go
package httpclient

import (
    "net"
    "net/http"
    "time"
)

// Production-ready HTTP client
func NewHTTPClient() *http.Client {
    transport := &http.Transport{
        // Connection pooling
        MaxIdleConns:        100,              // Total idle connections across all hosts
        MaxIdleConnsPerHost: 10,               // Idle connections per host
        MaxConnsPerHost:     0,                // 0 = unlimited (use with caution)
        
        // Timeouts
        IdleConnTimeout:       90 * time.Second,
        TLSHandshakeTimeout:   10 * time.Second,
        ResponseHeaderTimeout: 10 * time.Second,
        ExpectContinueTimeout: 1 * time.Second,
        
        // Dialer configuration
        DialContext: (&net.Dialer{
            Timeout:   30 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,
        
        // HTTP/2 (optional, enabled by default)
        ForceAttemptHTTP2: true,
        
        // Disable compression if you handle it yourself
        DisableCompression: false,
    }
    
    return &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second, // Overall request timeout
    }
}

// Usage
var httpClient = NewHTTPClient()

func makeRequest(ctx context.Context, url string) (*http.Response, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    
    // IMPORTANT: Always close response body to return connection to pool
    // defer resp.Body.Close() // Do this in caller
    
    return resp, nil
}
```

**Critical: Connection Reuse**

```go
// ❌ BAD: Connection not reused
resp, err := httpClient.Get(url)
if err != nil {
    return err
}
// Missing: resp.Body.Close() - connection leaks!

// ✅ GOOD: Connection properly returned to pool
resp, err := httpClient.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close()

// Read and discard body to enable connection reuse
io.Copy(io.Discard, resp.Body)
```

#### 5.2 Node.js HTTP Agent Configuration

```typescript
import http from 'http';
import https from 'https';

// Create agents with connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,        // Max concurrent connections per host
  maxFreeSockets: 256,    // Max idle connections per host
  timeout: 30000,
  scheduling: 'lifo',     // Last-in-first-out (better for keep-alive)
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  timeout: 30000,
  scheduling: 'lifo',
});

// Use with fetch (Node 18+)
const response = await fetch('https://api.example.com/users', {
  agent: httpsAgent,
});

// Use with axios
import axios from 'axios';

const client = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 30000,
});
```

#### 5.3 Connection Pool Sizing

**Formula:**

```
MaxIdleConnsPerHost = (Expected RPS to host) * (Average response time in seconds) * 1.5

Example:
- 100 RPS to api.example.com
- 200ms average response time
- MaxIdleConnsPerHost = 100 * 0.2 * 1.5 = 30
```

**Conservative defaults:**

```
Small service:  MaxIdleConnsPerHost = 10
Medium service: MaxIdleConnsPerHost = 50
Large service:  MaxIdleConnsPerHost = 100
```

#### 5.4 Monitoring Connection Pools

```go
// Add metrics for connection pool health
var (
    httpConnectionsActive = promauto.NewGauge(prometheus.GaugeOpts{
        Name: "http_client_connections_active",
        Help: "Number of active HTTP client connections",
    })
    
    httpConnectionsIdle = promauto.NewGauge(prometheus.GaugeOpts{
        Name: "http_client_connections_idle",
        Help: "Number of idle HTTP client connections",
    })
)

// Periodically report connection stats
func monitorConnectionPool(transport *http.Transport) {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        // Note: These are not directly exposed by http.Transport
        // You may need to use runtime metrics or custom tracking
        httpConnectionsActive.Set(float64(getActiveConnections(transport)))
        httpConnectionsIdle.Set(float64(getIdleConnections(transport)))
    }
}
```

#### 5.5 Per-Host Connection Limits

```go
// Different limits for different services
func NewMultiHostClient() *http.Client {
    transport := &http.Transport{
        MaxIdleConns:        200,
        MaxIdleConnsPerHost: 20, // Default
        IdleConnTimeout:     90 * time.Second,
        
        DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
            // Custom logic per host
            if strings.Contains(addr, "high-volume-api.com") {
                // Allow more connections to high-volume service
                // (Note: MaxIdleConnsPerHost is global, this is just an example)
            }
            
            dialer := &net.Dialer{
                Timeout:   30 * time.Second,
                KeepAlive: 30 * time.Second,
            }
            return dialer.DialContext(ctx, network, addr)
        },
    }
    
    return &http.Client{Transport: transport}
}
```

---

## 6. Implementation Location: Edge vs UI

### Decision Matrix

| Feature | Edge/Proxy | UI/Client | Reasoning |
|---------|-----------|-----------|-----------|
| **Correlation ID Generation** | ✅ Edge | ❌ Client | Server controls tracing |
| **Correlation ID Propagation** | ✅ Both | ✅ Both | Client sends, server forwards |
| **Structured Logging** | ✅ Edge | ⚠️ Limited | Server-side for security/aggregation |
| **Rate Limiting** | ✅ Edge | ❌ Client | Cannot trust client |
| **Metrics Collection** | ✅ Edge | ⚠️ Limited | Server-side for accuracy |
| **Connection Pooling** | ✅ Edge | ✅ Client | Both benefit from pooling |
| **Request Validation** | ✅ Edge | ⚠️ UX only | Server must validate |
| **Authentication** | ✅ Edge | ❌ Client | Security requirement |

### Detailed Recommendations

#### 6.1 Correlation IDs

**Edge/Proxy:**
```
✅ Generate if not present
✅ Validate format
✅ Add to response headers
✅ Propagate to downstream services
✅ Include in all logs
```

**UI/Client:**
```
✅ Send existing ID if available (e.g., from previous request)
✅ Display in error messages for support
❌ Don't generate (let server control)
```

#### 6.2 Rate Limiting

**Edge/Proxy (REQUIRED):**
```
✅ Enforce all rate limits
✅ Return 429 with Retry-After
✅ Set rate limit headers
✅ Track per user/IP/API key
```

**UI/Client (OPTIONAL):**
```
✅ Display rate limit info to user
✅ Implement exponential backoff
✅ Show "rate limited" UI state
❌ Don't rely on client-side limiting for security
```

#### 6.3 Logging

**Edge/Proxy:**
```
✅ All request/response logging
✅ Error logging with full context
✅ Performance metrics
✅ Security events
```

**UI/Client:**
```
⚠️ Client-side errors only (for debugging)
⚠️ User actions (analytics)
❌ Don't log sensitive data
❌ Don't rely on client logs for security
```

#### 6.4 Metrics

**Edge/Proxy:**
```
✅ Request counts, latencies, errors
✅ Rate limit hits
✅ Connection pool stats
✅ Downstream service health
```

**UI/Client:**
```
⚠️ Page load times (RUM - Real User Monitoring)
⚠️ Client-side errors
⚠️ User engagement metrics
```

---

## 7. Common Pitfalls

### 7.1 Correlation IDs

❌ **Pitfall:** Not propagating correlation IDs to downstream services

```typescript
// BAD
const user = await fetch('https://api.example.com/users/123');

// GOOD
const user = await fetch('https://api.example.com/users/123', {
  headers: { 'X-Request-ID': req.correlationId },
});
```

❌ **Pitfall:** Not including correlation ID in error responses

```typescript
// BAD
res.status(500).json({ error: 'Internal server error' });

// GOOD
res.status(500).json({
  error: 'Internal server error',
  correlation_id: req.correlationId,
  message: 'Please provide this ID to support',
});
```

❌ **Pitfall:** Generating new correlation ID for each service

```
Client → Gateway (ID: abc) → Service A (ID: xyz) → Service B (ID: 123)
❌ Cannot trace request across services

Client → Gateway (ID: abc) → Service A (ID: abc) → Service B (ID: abc)
✅ Can trace entire request flow
```

### 7.2 Structured Logging

❌ **Pitfall:** Logging sensitive data

```typescript
// BAD
logger.info({ password: user.password }); // NEVER!
logger.info({ creditCard: payment.card }); // NEVER!

// GOOD
logger.info({ userId: user.id, email: user.email });
```

❌ **Pitfall:** Inconsistent field names

```typescript
// BAD - inconsistent naming
logger.info({ user_id: '123' });
logger.info({ userId: '456' });
logger.info({ UserID: '789' });

// GOOD - consistent snake_case
logger.info({ user_id: '123' });
logger.info({ user_id: '456' });
logger.info({ user_id: '789' });
```

❌ **Pitfall:** Not using log levels correctly

```typescript
// BAD
logger.info('Database connection failed'); // Should be ERROR
logger.error('User logged in'); // Should be INFO

// GOOD
logger.error('Database connection failed');
logger.info('User logged in');
```

### 7.3 Rate Limiting

❌ **Pitfall:** Rate limiting by IP only (shared IPs, NAT)

```typescript
// BAD - only IP
const key = req.ip;

// BETTER - authenticated user
const key = req.user?.id || req.ip;

// BEST - multiple strategies
const key = req.user?.id || `ip:${req.ip}` || `session:${req.sessionId}`;
```

❌ **Pitfall:** Not returning proper headers

```typescript
// BAD
res.status(429).json({ error: 'Too many requests' });

// GOOD
res.status(429)
  .header('X-RateLimit-Limit', '100')
  .header('X-RateLimit-Remaining', '0')
  .header('X-RateLimit-Reset', resetTime.toString())
  .header('Retry-After', '60')
  .json({ error: 'Too many requests' });
```

❌ **Pitfall:** Inconsistent rate limits across instances (without Redis)

```
Instance 1: User makes 100 requests → OK
Instance 2: User makes 100 requests → OK
Total: 200 requests (limit was 100!)

Solution: Use Redis for distributed rate limiting
```

### 7.4 Connection Pooling

❌ **Pitfall:** Not closing response bodies (Go)

```go
// BAD - connection leak
resp, err := httpClient.Get(url)
if err != nil {
    return err
}
// Missing: resp.Body.Close()

// GOOD
resp, err := httpClient.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close()
io.Copy(io.Discard, resp.Body) // Drain body for connection reuse
```

❌ **Pitfall:** Creating new HTTP client for each request

```go
// BAD - no connection reuse
func makeRequest(url string) error {
    client := &http.Client{} // New client every time!
    resp, err := client.Get(url)
    // ...
}

// GOOD - reuse client
var httpClient = &http.Client{
    Transport: &http.Transport{
        MaxIdleConnsPerHost: 10,
    },
}

func makeRequest(url string) error {
    resp, err := httpClient.Get(url)
    // ...
}
```

❌ **Pitfall:** Pool size too small (connection starvation)

```
100 RPS * 0.5s latency = 50 concurrent connections needed
MaxIdleConnsPerHost = 10 → Bottleneck!

Solution: Increase to 50-75
```

❌ **Pitfall:** Pool size too large (resource exhaustion)

```
MaxIdleConnsPerHost = 10000 → Too many file descriptors!

Solution: Use realistic values (10-100 per host)
```

### 7.5 Metrics

❌ **Pitfall:** Too many label combinations (cardinality explosion)

```typescript
// BAD - unbounded labels
httpRequests.labels(req.method, req.url, req.user.id); // Millions of combinations!

// GOOD - bounded labels
httpRequests.labels(req.method, req.route.path); // Limited combinations
```

❌ **Pitfall:** Not using histograms for latency

```typescript
// BAD - average only
const avgLatency = new Gauge({ name: 'avg_latency' });

// GOOD - distribution
const latency = new Histogram({
  name: 'request_duration_seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
```

### 7.6 General Architecture

❌ **Pitfall:** Implementing security in client only

```
Client-side rate limiting → Can be bypassed
Client-side validation → Can be bypassed
Client-side authentication → Can be bypassed

Solution: Always enforce on server/edge
```

❌ **Pitfall:** Not handling downstream failures

```typescript
// BAD - no timeout, no retry
const user = await fetch('https://api.example.com/users/123');

// GOOD - timeout, retry, circuit breaker
const user = await fetchWithRetry('https://api.example.com/users/123', {
  timeout: 5000,
  retries: 3,
  backoff: 'exponential',
});
```

❌ **Pitfall:** Synchronous logging in hot path

```typescript
// BAD - blocks request
app.use((req, res, next) => {
  fs.appendFileSync('access.log', JSON.stringify(req)); // Blocks!
  next();
});

// GOOD - async logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }); // Async
  next();
});
```

---

## Summary Checklist

### Correlation IDs
- [ ] Generate at edge if not present
- [ ] Use standard header names (X-Request-ID)
- [ ] Propagate to all downstream services
- [ ] Include in all logs
- [ ] Return in response headers
- [ ] Include in error messages

### Structured Logging
- [ ] Use JSON format in production
- [ ] Include correlation ID in all logs
- [ ] Use appropriate log levels
- [ ] Redact sensitive data
- [ ] Log request/response lifecycle
- [ ] Include context (user_id, ip, etc.)

### Rate Limiting
- [ ] Implement at edge/proxy (not client)
- [ ] Use token bucket or sliding window
- [ ] Return proper headers (X-RateLimit-*, Retry-After)
- [ ] Use Redis for distributed systems
- [ ] Different limits per user tier
- [ ] Monitor rate limit hits

### Metrics
- [ ] Use Prometheus or similar
- [ ] Track request count, latency, errors
- [ ] Use histograms for distributions
- [ ] Avoid high cardinality labels
- [ ] Expose /metrics endpoint
- [ ] Monitor connection pool health

### Connection Pooling
- [ ] Configure MaxIdleConnsPerHost appropriately
- [ ] Set timeouts (idle, TLS, response)
- [ ] Always close response bodies (Go)
- [ ] Reuse HTTP clients
- [ ] Monitor pool utilization
- [ ] Size pools based on traffic

### Architecture
- [ ] Enforce security at edge
- [ ] Handle downstream failures gracefully
- [ ] Use async logging
- [ ] Implement health checks
- [ ] Plan for horizontal scaling
- [ ] Test under load

---

## References

- W3C Trace Context: https://www.w3.org/TR/trace-context/
- Prometheus Best Practices: https://prometheus.io/docs/practices/
- Go HTTP Client: https://pkg.go.dev/net/http
- Token Bucket Algorithm: https://en.wikipedia.org/wiki/Token_bucket
- Structured Logging: https://www.structlog.org/

