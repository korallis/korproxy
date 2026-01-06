# CLIProxyAPI - Management API Reference

> Quick reference for CLIProxyAPI Management API endpoints used by KorProxy

## Base URL
```
http://localhost:8317/v0/management/
```

## Authentication
All requests require one of:
```
Authorization: Bearer <management-key>
X-Management-Key: <management-key>
```

---

## Core Endpoints

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get full configuration as JSON |
| GET | `/config.yaml` | Download config as YAML file |
| PUT | `/config.yaml` | Replace config with YAML document |

### Debug Mode
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/debug` | - | Get debug status |
| PUT | `/debug` | `{"value": true}` | Set debug mode |

### Proxy URL
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/proxy-url` | - | Get proxy URL |
| PUT | `/proxy-url` | `{"value": "socks5://..."}` | Set proxy URL |
| DELETE | `/proxy-url` | - | Clear proxy URL |

---

## API Keys

### Gemini API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gemini-api-key` | List all Gemini keys |
| PUT | `/gemini-api-key` | Replace all keys |
| PATCH | `/gemini-api-key` | Update one key |
| DELETE | `/gemini-api-key?api-key=X` | Delete by key |
| DELETE | `/gemini-api-key?index=0` | Delete by index |

**Key Object:**
```json
{
  "api-key": "AIza...",
  "base-url": "https://...",
  "proxy-url": "socks5://...",
  "headers": {"X-Custom": "value"},
  "excluded-models": ["model-name"]
}
```

### Claude API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/claude-api-key` | List all Claude keys |
| PUT | `/claude-api-key` | Replace all keys |
| PATCH | `/claude-api-key` | Update one key |
| DELETE | `/claude-api-key?api-key=X` | Delete by key |

### Codex API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/codex-api-key` | List all Codex keys |
| PUT | `/codex-api-key` | Replace all keys |
| PATCH | `/codex-api-key` | Update one key |
| DELETE | `/codex-api-key?api-key=X` | Delete by key |

### Proxy Service API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-keys` | List access tokens |
| PUT | `/api-keys` | Replace all `["k1","k2"]` |
| PATCH | `/api-keys` | Update one `{"old":"k1","new":"k2"}` |
| DELETE | `/api-keys?value=k1` | Delete by value |

---

## OpenAI Compatibility Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/openai-compatibility` | List all providers |
| PUT | `/openai-compatibility` | Replace all providers |
| PATCH | `/openai-compatibility` | Update one provider |
| DELETE | `/openai-compatibility?name=X` | Delete by name |

**Provider Object:**
```json
{
  "name": "openrouter",
  "base-url": "https://openrouter.ai/api/v1",
  "api-key-entries": [
    {"api-key": "sk-...", "proxy-url": ""}
  ],
  "models": [
    {"name": "model-id", "alias": "friendly-name"}
  ],
  "headers": {"X-Provider": "value"}
}
```

---

## Authentication Files

### List Files
```
GET /auth-files
```
**Response:**
```json
{
  "files": [
    {
      "id": "user@example.com",
      "name": "user@example.json",
      "provider": "claude",
      "status": "ready",
      "disabled": false,
      "email": "user@example.com"
    }
  ]
}
```

### Upload File
```
POST /auth-files
Content-Type: multipart/form-data

file=@credentials.json
```

### Download File
```
GET /auth-files/download?name=user.json
```

### Delete File
```
DELETE /auth-files?name=user.json
```

### Delete All Files
```
DELETE /auth-files?all=true
```

---

## OAuth Flows

### Start OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/anthropic-auth-url` | Start Claude OAuth |
| GET | `/codex-auth-url` | Start Codex OAuth |
| GET | `/gemini-cli-auth-url?project_id=X` | Start Gemini OAuth |
| GET | `/antigravity-auth-url` | Start Antigravity OAuth |
| GET | `/qwen-auth-url` | Start Qwen OAuth |
| GET | `/iflow-auth-url` | Start iFlow OAuth |

**Response:**
```json
{
  "status": "ok",
  "url": "https://...",
  "state": "auth-1234567890"
}
```

### Poll OAuth Status
```
GET /get-auth-status?state=auth-1234567890
```

**Response (waiting):**
```json
{"status": "wait"}
```

**Response (success):**
```json
{"status": "ok"}
```

**Response (error):**
```json
{"status": "error", "error": "Authentication failed"}
```

---

## Monitoring

### Usage Statistics
```
GET /usage
```
**Response:**
```json
{
  "usage": {
    "total_requests": 100,
    "success_count": 95,
    "failure_count": 5,
    "total_tokens": 50000,
    "requests_by_day": {"2024-12-19": 100},
    "tokens_by_day": {"2024-12-19": 50000}
  }
}
```

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logs?after=1234567890` | Get logs after timestamp |
| DELETE | `/logs` | Clear all logs |

**Response:**
```json
{
  "lines": ["2024-12-19 12:00:00 info ..."],
  "line-count": 100,
  "latest-timestamp": 1234567890
}
```

---

## Settings

### Request Retry
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/request-retry` | - |
| PUT | `/request-retry` | `{"value": 3}` |

### Request Log
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/request-log` | - |
| PUT | `/request-log` | `{"value": true}` |

### Logging to File
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/logging-to-file` | - |
| PUT | `/logging-to-file` | `{"value": true}` |

### Usage Statistics Toggle
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/usage-statistics-enabled` | - |
| PUT | `/usage-statistics-enabled` | `{"value": true}` |

### WebSocket Auth
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/ws-auth` | - |
| PUT | `/ws-auth` | `{"value": true}` |

### Quota Exceeded Behavior
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/quota-exceeded/switch-project` | - |
| PUT | `/quota-exceeded/switch-project` | `{"value": true}` |
| GET | `/quota-exceeded/switch-preview-model` | - |
| PUT | `/quota-exceeded/switch-preview-model` | `{"value": true}` |

---

## Utility

### Latest Version
```
GET /latest-version
```
**Response:**
```json
{"latest-version": "v6.6.27"}
```

### OAuth Excluded Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth-excluded-models` | Get exclusion map |
| PUT | `/oauth-excluded-models` | Replace map |
| PATCH | `/oauth-excluded-models` | Update provider |
| DELETE | `/oauth-excluded-models?provider=X` | Delete provider |

---

## Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | `invalid body` | Malformed request |
| 401 | `missing management key` | No auth header |
| 401 | `invalid management key` | Wrong key |
| 403 | `remote management disabled` | Non-localhost blocked |
| 404 | `item not found` | Resource doesn't exist |
| 422 | `invalid_config` | Config validation failed |
| 500 | `failed to save config` | Write error |
| 503 | `core auth manager unavailable` | Service unavailable |

---

*Reference based on CLIProxyAPI v6.6.27*
