# [Provider Name] Integration Guide

## Overview

[Brief description of the provider, their main offerings, and what makes them unique]

## Prerequisites

- KorProxy desktop app installed and running
- [Provider Name] account with active subscription
- [Any other requirements specific to the provider]

## Authentication

### OAuth Setup (if applicable)

1. Open KorProxy desktop app
2. Navigate to **Providers** tab
3. Click **Connect** on the [Provider Name] card
4. Complete the OAuth flow in the browser window
5. Grant KorProxy the necessary permissions
6. Return to KorProxy - your account should now be connected

### API Key Setup (if applicable)

1. Go to [Provider console URL]
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key
5. In KorProxy, go to **Settings > Config**
6. Add your API key in the configuration

```yaml
providers:
  [provider_id]:
    api_key: "your-api-key-here"
```

## Supported Models

| Model ID | Display Name | Best For | Thinking/Reasoning |
|----------|--------------|----------|-------------------|
| `model-id-1` | Model Name 1 | Complex tasks, coding | 1024-100000 tokens |
| `model-id-2` | Model Name 2 | Fast responses | N/A |
| `model-id-3` | Model Name 3 | Balanced workloads | Low/Medium/High |

## Configuration Examples

### Cline

```json
{
  "apiProvider": "openai",
  "apiBaseUrl": "http://localhost:1337/v1",
  "apiKey": "korproxy",
  "model": "[model-id]"
}
```

### Cursor

In Cursor settings, configure:
- **API Base URL**: `http://localhost:1337/v1`
- **API Key**: `korproxy` (or any string)
- **Model**: `[model-id]`

### Windsurf

```json
{
  "model": "[model-id]",
  "baseUrl": "http://localhost:1337/v1"
}
```

### Continue.dev

```json
{
  "models": [
    {
      "title": "[Provider Name] via KorProxy",
      "provider": "openai",
      "model": "[model-id]",
      "apiBase": "http://localhost:1337/v1"
    }
  ]
}
```

## Using Thinking/Reasoning Features

### Models with Thinking Support

For models that support extended thinking (like Claude), the thinking budget is automatically managed. You can adjust it via:

```json
{
  "model": "[model-id]",
  "thinkingBudget": 50000
}
```

### Models with Reasoning Levels

For models with reasoning levels (like Codex), append the level in parentheses:

```
[model-id](high)
[model-id](medium)
[model-id](low)
```

## Troubleshooting

### Common Issues

#### "Provider not connected"

**Cause**: No authenticated account for this provider.

**Solution**: 
1. Open KorProxy
2. Go to Providers
3. Connect your [Provider Name] account

#### "Rate limit exceeded"

**Cause**: Too many requests in a short period.

**Solution**:
- Wait a few minutes before retrying
- Add multiple accounts to enable load balancing
- Consider using a different model

#### "Token expired"

**Cause**: OAuth token has expired.

**Solution**:
1. Go to Providers in KorProxy
2. Click the refresh button on your account
3. Re-authenticate if needed

#### "Model not found"

**Cause**: Invalid model ID or model not available for your subscription.

**Solution**:
- Verify the model ID is correct
- Check that your subscription includes access to this model
- See [Supported Models](#supported-models) for valid model IDs

### Testing Connection

1. In KorProxy, go to the Providers page
2. Find your connected [Provider Name] account
3. Click **Run Test**
4. Check the result for latency and any errors

## Known Limitations

- [Any provider-specific rate limits]
- [Features not supported via proxy]
- [Model availability restrictions]
- [Regional availability notes]

## Multi-Account Support

KorProxy supports multiple [Provider Name] accounts for load balancing:

1. Connect additional accounts via the Providers page
2. Enable/disable accounts individually from the Accounts page
3. Requests are automatically distributed across enabled accounts

## API Endpoints

KorProxy provides these endpoints for [Provider Name]:

| Endpoint | Description |
|----------|-------------|
| `/v1/chat/completions` | OpenAI-compatible chat completions |
| `/v1/messages` | Anthropic-compatible messages (Claude only) |
| `/v1/models` | List available models |

## Additional Resources

- [[Provider Name] Official Documentation](https://example.com/docs)
- [KorProxy Documentation](https://korproxy.dev/docs)
- [GitHub Issues](https://github.com/korallis/korproxy/issues)
