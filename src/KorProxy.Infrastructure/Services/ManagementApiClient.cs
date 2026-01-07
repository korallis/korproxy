using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// HTTP client for CLIProxyAPI's Management API
/// </summary>
public sealed class ManagementApiClient : IManagementApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ManagementApiClient> _logger;

    private const string FallbackProxyApiKey = "korproxy-local-key";
    
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public ManagementApiClient(HttpClient httpClient, ILogger<ManagementApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> PingAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/", ct);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Ping failed");
            return false;
        }
    }

    public async Task<ProxyConfig?> GetConfigAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/config", ct);
            response.EnsureSuccessStatusCode();
            
            var dto = await response.Content.ReadFromJsonAsync<ConfigDto>(JsonOptions, ct);
            if (dto == null) return null;

            return new ProxyConfig
            {
                Port = dto.Port,
                Host = dto.Host ?? "",
                AutoStart = dto.AutoStart,
                ApiKeys = dto.ApiKeys ?? [],
                Debug = dto.Debug,
                UsageStatisticsEnabled = dto.UsageStatisticsEnabled,
                AmpCode = dto.Ampcode == null
                    ? null
                    : new AmpCodeConfig
                    {
                        UpstreamUrl = dto.Ampcode.UpstreamUrl,
                        UpstreamApiKey = dto.Ampcode.UpstreamApiKey,
                        RestrictManagementToLocalhost = dto.Ampcode.RestrictManagementToLocalhost
                    }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get config");
            return null;
        }
    }

    public async Task<string?> GetConfigYamlAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/config.yaml", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get config.yaml");
            return null;
        }
    }

    public async Task<bool> UpdateConfigAsync(string yamlContent, CancellationToken ct = default)
    {
        try
        {
            var content = new StringContent(yamlContent, System.Text.Encoding.UTF8, "application/x-yaml");
            var response = await _httpClient.PutAsync("/v0/management/config.yaml", content, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Failed to update config: {StatusCode} - {Body}", response.StatusCode, errorBody);
            }
            
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update config");
            return false;
        }
    }

    public async Task<UsageStats?> GetUsageAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/usage", ct);
            response.EnsureSuccessStatusCode();

            // CLIProxyAPI's /v0/management/usage schema has changed across versions.
            // Observed variants:
            // 1) { "total_requests": 123, "successful_requests": 120, ... }
            // 2) { "failed_requests": 0, "usage": { "total_requests": 0, "success_count": 0, "failure_count": 0, "apis": { ... } } }
            // Keep parsing tolerant and map into our stable UsageStats model.
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            var root = doc.RootElement;
            var usageElement = root;
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("usage", out var nestedUsage))
            {
                usageElement = nestedUsage;
            }

            static int ReadInt(JsonElement obj, params string[] names)
            {
                foreach (var name in names)
                {
                    if (obj.ValueKind != JsonValueKind.Object) continue;
                    if (!obj.TryGetProperty(name, out var p)) continue;

                    if (p.ValueKind == JsonValueKind.Number && p.TryGetInt32(out var n))
                        return n;

                    if (p.ValueKind == JsonValueKind.String && int.TryParse(p.GetString(), out var s))
                        return s;
                }

                return 0;
            }

            static int ReadNestedCount(JsonElement element)
            {
                // Some dict values may be objects; try common count fields.
                if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var n))
                    return n;
                if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var s))
                    return s;
                if (element.ValueKind == JsonValueKind.Object)
                {
                    var n2 = ReadInt(element, "total_requests", "totalRequests", "requests", "count");
                    if (n2 != 0) return n2;
                }

                return 0;
            }

            var total = ReadInt(usageElement, "total_requests", "totalRequests", "total_requests_count", "total");
            var success = ReadInt(usageElement, "successful_requests", "successfulRequests", "success_count", "successCount");
            var failure = ReadInt(usageElement, "failed_requests", "failedRequests", "failure_count", "failureCount");
            if (failure == 0)
            {
                // Some versions expose failed_requests at the top-level.
                failure = ReadInt(root, "failed_requests", "failedRequests");
            }

            long totalTokens = 0;
            if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("total_tokens", out var totalTokensEl))
            {
                if (totalTokensEl.ValueKind == JsonValueKind.Number && totalTokensEl.TryGetInt64(out var t))
                    totalTokens = t;
                else if (totalTokensEl.ValueKind == JsonValueKind.String && long.TryParse(totalTokensEl.GetString(), out var ts))
                    totalTokens = ts;
            }

            var byProvider = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("apis", out var apis) && apis.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in apis.EnumerateObject())
                {
                    byProvider[prop.Name] = ReadNestedCount(prop.Value);
                }
            }
            else if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("requests_by_provider", out var rbp) && rbp.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in rbp.EnumerateObject())
                {
                    byProvider[prop.Name] = ReadNestedCount(prop.Value);
                }
            }

            var byModel = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("requests_by_model", out var rbm) && rbm.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in rbm.EnumerateObject())
                {
                    byModel[prop.Name] = ReadNestedCount(prop.Value);
                }
            }

            static bool TryParseDateOnlyKey(string key, out DateOnly date)
            {
                // CLIProxyAPI keys appear to be ISO local dates like "2025-12-19".
                return DateOnly.TryParseExact(key, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out date)
                       || DateOnly.TryParse(key, out date);
            }

            var requestsByDay = new Dictionary<DateOnly, int>();
            if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("requests_by_day", out var rbd) && rbd.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in rbd.EnumerateObject())
                {
                    if (!TryParseDateOnlyKey(prop.Name, out var day))
                        continue;
                    requestsByDay[day] = ReadNestedCount(prop.Value);
                }
            }

            var tokensByDay = new Dictionary<DateOnly, long>();
            if (usageElement.ValueKind == JsonValueKind.Object && usageElement.TryGetProperty("tokens_by_day", out var tbd) && tbd.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in tbd.EnumerateObject())
                {
                    if (!TryParseDateOnlyKey(prop.Name, out var day))
                        continue;

                    var v = prop.Value;
                    if (v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var n))
                        tokensByDay[day] = n;
                    else if (v.ValueKind == JsonValueKind.String && long.TryParse(v.GetString(), out var s))
                        tokensByDay[day] = s;
                    else if (v.ValueKind == JsonValueKind.Object)
                        tokensByDay[day] = ReadInt(v, "total_tokens", "tokens", "count");
                }
            }

            return new UsageStats
            {
                TotalRequests = total,
                SuccessfulRequests = success,
                FailedRequests = failure,
                TotalTokens = totalTokens,
                RequestsByProvider = byProvider,
                RequestsByModel = byModel
                ,
                RequestsByDay = requestsByDay,
                TokensByDay = tokensByDay
            };
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to get usage stats");
            return null;
        }
    }

    public async Task<List<ProviderAccount>> GetAccountsAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/auth-files", ct);
            response.EnsureSuccessStatusCode();
            
            var dto = await response.Content.ReadFromJsonAsync<AuthFilesDto>(JsonOptions, ct);
            
            var accounts = new List<ProviderAccount>();
            
            foreach (var provider in Providers.All)
            {
                var authFile = dto?.Files?.FirstOrDefault(f => 
                    (f.Provider?.Equals(provider, StringComparison.OrdinalIgnoreCase) == true) ||
                    (f.Type?.Equals(provider, StringComparison.OrdinalIgnoreCase) == true));
                
                accounts.Add(new ProviderAccount
                {
                    Provider = provider,
                    DisplayName = Providers.GetDisplayName(provider),
                    IsConnected = authFile?.IsConnected ?? false,
                    Email = authFile?.Email,
                    TokenExpiry = authFile?.Modtime,
                    NeedsRefresh = false,
                    ErrorMessage = authFile?.StatusMessage,
                    LastRefresh = authFile?.LastRefresh
                });
            }
            
            return accounts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get accounts");
            return [];
        }
    }

    public async Task<string?> GetOAuthUrlAsync(string provider, CancellationToken ct = default)
    {
        try
        {
            var endpoint = GetOAuthEndpoint(provider);
            var response = await _httpClient.GetAsync($"/v0/management/{endpoint}?is_webui=true", ct);
            response.EnsureSuccessStatusCode();
            
            var dto = await response.Content.ReadFromJsonAsync<OAuthUrlDto>(JsonOptions, ct);
            return dto?.Url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get OAuth URL for {Provider}", provider);
            return null;
        }
    }

    private static string GetOAuthEndpoint(string provider) => provider switch
    {
        "gemini" => "gemini-cli-auth-url",
        "claude" => "anthropic-auth-url",
        "codex" => "codex-auth-url",
        "qwen" => "qwen-auth-url",
        "iflow" => "iflow-auth-url",
        "antigravity" => "antigravity-auth-url",
        _ => $"{provider}-auth-url"
    };

    public async Task<bool> CheckOAuthStatusAsync(string state, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/v0/management/get-auth-status?state={Uri.EscapeDataString(state)}", ct);
            response.EnsureSuccessStatusCode();
            
            var dto = await response.Content.ReadFromJsonAsync<OAuthStatusDto>(JsonOptions, ct);
            return dto?.Status == "ok";
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to check OAuth status");
            return false;
        }
    }

    public async Task<List<LogEntry>> GetLogsAsync(DateTimeOffset? after = null, CancellationToken ct = default)
    {
        try
        {
            var url = "/v0/management/logs";
            if (after.HasValue)
            {
                url += $"?after={after.Value:o}";
            }
            
            var response = await _httpClient.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();
            
            var dto = await response.Content.ReadFromJsonAsync<LogsDto>(JsonOptions, ct);
            
            return dto?.Entries?.Select(e => new LogEntry(
                e.Timestamp,
                e.Level ?? "INFO",
                e.Source ?? "proxy",
                e.Message ?? ""
            )).ToList() ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to get logs");
            return [];
        }
    }

    public async Task<List<AvailableModel>> GetModelsAsync(CancellationToken ct = default)
    {
        var apiKey = await GetFirstProxyApiKeyAsync(ct);
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("No proxy API key available. Configure api-keys in config.yaml (or use the default korproxy-local-key). ");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/v1/models");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await SafeReadBodyAsync(response, ct);
            throw new HttpRequestException($"Failed to load models: {(int)response.StatusCode} {response.ReasonPhrase}. {body}");
        }

        // CLIProxyAPI aims for OpenAI-compatible responses, but schemas may vary slightly
        // across versions; keep parsing tolerant.
        var contentStream = await response.Content.ReadAsStreamAsync(ct);
        try
        {
            var dto = await JsonSerializer.DeserializeAsync<ModelsResponseDto>(contentStream, JsonOptions, ct);
            if (dto?.Data != null)
                return MapModels(dto.Data);
        }
        catch
        {
            // Fall back to JsonDocument parsing below.
        }

        contentStream.Position = 0;
        using var doc = await JsonDocument.ParseAsync(contentStream, cancellationToken: ct);
        if (doc.RootElement.ValueKind != JsonValueKind.Object)
            return [];

        if (TryReadModelsArray(doc.RootElement, out var modelsArray))
            return ParseModelsArray(modelsArray);

        return [];
    }

    public async Task<List<string>> GetProxyApiKeysAsync(CancellationToken ct = default)
    {
        try
        {
            using var response = await _httpClient.GetAsync("/v0/management/api-keys", ct);
            if (response.IsSuccessStatusCode)
            {
                var dto = await response.Content.ReadFromJsonAsync<ApiKeysDto>(JsonOptions, ct);
                var keys = dto?.ApiKeys
                    ?.Where(k => !string.IsNullOrWhiteSpace(k))
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                if (keys is { Count: > 0 })
                    return keys;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to read /v0/management/api-keys; falling back to default");
        }

        return [FallbackProxyApiKey];
    }

    public async Task<bool> TestProviderAsync(string provider, CancellationToken ct = default)
    {
        try
        {
            var apiKey = await GetFirstProxyApiKeyAsync(ct);
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("No proxy API key available for test request");
                return false;
            }

            var model = GetDefaultModelForProvider(provider);
            if (string.IsNullOrEmpty(model))
            {
                _logger.LogWarning("Unknown provider {Provider}, cannot determine default model", provider);
                return false;
            }

            // Create a minimal completion request that will trigger token refresh
            // if the executor determines the token is near expiry
            var request = new
            {
                model,
                messages = new[] { new { role = "user", content = "hi" } },
                max_tokens = 1
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/completions");
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            httpRequest.Content = JsonContent.Create(request, options: JsonOptions);

            using var response = await _httpClient.SendAsync(httpRequest, ct);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogDebug("Test request to {Provider} succeeded", provider);
                return true;
            }

            var body = await SafeReadBodyAsync(response, ct);
            _logger.LogWarning("Test request to {Provider} failed: {StatusCode} {Body}", 
                provider, (int)response.StatusCode, body);
            return false;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Test request to {Provider} threw exception", provider);
            return false;
        }
    }

    /// <summary>
    /// Map providers to their default/fastest models for minimal test requests.
    /// </summary>
    private static string GetDefaultModelForProvider(string provider) => provider.ToLowerInvariant() switch
    {
        Providers.Claude => "claude-haiku-4-5-20251001",
        Providers.Codex => "gpt-5.1-codex-mini",
        Providers.Antigravity => "gpt-5.1-codex-mini",
        Providers.Gemini => "gemini-2.5-flash-lite",
        Providers.Qwen => "qwen-coder-plus-latest",
        Providers.IFlow => "gpt-4o-mini",
        _ => ""
    };

    private static List<AvailableModel> MapModels(List<ModelDto> models)
        => models
            .Where(m => !string.IsNullOrWhiteSpace(m.Id))
            .Select(m => new AvailableModel
            {
                Id = m.Id ?? "",
                DisplayName = m.DisplayName,
                OwnedBy = m.OwnedBy,
                Type = m.Type
            })
            .ToList();

    private static bool TryReadModelsArray(JsonElement root, out JsonElement array)
    {
        // Standard OpenAI: { "data": [ ... ] }
        if (root.TryGetProperty("data", out array) && array.ValueKind == JsonValueKind.Array)
            return true;

        // Alternate: { "models": [ ... ] }
        if (root.TryGetProperty("models", out array) && array.ValueKind == JsonValueKind.Array)
            return true;

        // Alternate nested: { "data": { "models": [ ... ] } }
        if (root.TryGetProperty("data", out var dataObj) && dataObj.ValueKind == JsonValueKind.Object &&
            dataObj.TryGetProperty("models", out array) && array.ValueKind == JsonValueKind.Array)
            return true;

        array = default;
        return false;
    }

    private static List<AvailableModel> ParseModelsArray(JsonElement modelsArray)
    {
        var result = new List<AvailableModel>();

        foreach (var item in modelsArray.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
                continue;

            var id = item.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            if (string.IsNullOrWhiteSpace(id))
                continue;

            var displayName = item.TryGetProperty("display_name", out var dnEl) ? dnEl.GetString() :
                (item.TryGetProperty("displayName", out var dn2El) ? dn2El.GetString() : null);

            var ownedBy = item.TryGetProperty("owned_by", out var obEl) ? obEl.GetString() :
                (item.TryGetProperty("ownedBy", out var ob2El) ? ob2El.GetString() : null);

            var type = item.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null;

            result.Add(new AvailableModel
            {
                Id = id,
                DisplayName = displayName,
                OwnedBy = ownedBy,
                Type = type
            });
        }

        return result;
    }

    private async Task<string?> GetFirstProxyApiKeyAsync(CancellationToken ct)
    {
        // Prefer the dedicated endpoint; config responses may redact keys.
        try
        {
            using var response = await _httpClient.GetAsync("/v0/management/api-keys", ct);
            if (response.IsSuccessStatusCode)
            {
                var dto = await response.Content.ReadFromJsonAsync<ApiKeysDto>(JsonOptions, ct);
                var key = dto?.ApiKeys?.FirstOrDefault(k => !string.IsNullOrWhiteSpace(k));
                if (!string.IsNullOrWhiteSpace(key))
                    return key;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to read /v0/management/api-keys; falling back to default");
        }

        return FallbackProxyApiKey;
    }

    private static async Task<string> SafeReadBodyAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            if (string.IsNullOrWhiteSpace(text))
                return "";
            return text.Length > 400 ? text[..400] + "…" : text;
        }
        catch
        {
            return "";
        }
    }

    // DTOs for JSON deserialization
    private sealed class ConfigDto
    {
        public int Port { get; set; }
        public string? Host { get; set; }
        public bool AutoStart { get; set; }
        public List<string>? ApiKeys { get; set; }
        public bool Debug { get; set; }
        public bool UsageStatisticsEnabled { get; set; }

        public AmpcodeDto? Ampcode { get; set; }
    }

    private sealed class AmpcodeDto
    {
        public string? UpstreamUrl { get; set; }
        public string? UpstreamApiKey { get; set; }
        public bool RestrictManagementToLocalhost { get; set; } = true;
    }

    private sealed class AuthFilesDto
    {
        public List<AuthFileDto>? Files { get; set; }
    }

    private sealed class AuthFileDto
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Provider { get; set; }
        public string? Email { get; set; }
        public string? Status { get; set; }
        public string? StatusMessage { get; set; }
        public bool Disabled { get; set; }
        public bool Unavailable { get; set; }
        public DateTimeOffset? Modtime { get; set; }
        public DateTimeOffset? LastRefresh { get; set; }

        public bool IsConnected => !Disabled && !Unavailable && 
            !string.Equals(Status, "error", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Status, "disabled", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class OAuthUrlDto
    {
        public string? Url { get; set; }
    }

    private sealed class OAuthStatusDto
    {
        public string? Status { get; set; }
        public string? Error { get; set; }
    }

    private sealed class LogsDto
    {
        public List<LogEntryDto>? Entries { get; set; }
    }

    private sealed class LogEntryDto
    {
        public DateTimeOffset Timestamp { get; set; }
        public string? Level { get; set; }
        public string? Source { get; set; }
        public string? Message { get; set; }
    }

    private sealed class ModelsResponseDto
    {
        public List<ModelDto>? Data { get; set; }
    }

    private sealed class ModelDto
    {
        public string? Id { get; set; }
        public string? DisplayName { get; set; }
        public string? OwnedBy { get; set; }
        public string? Type { get; set; }
    }

    private sealed class ApiKeysDto
    {
        [JsonPropertyName("api-keys")]
        public List<string>? ApiKeys { get; set; }
    }

    public async Task<List<OpenAiCompatProvider>> GetOpenAiCompatProvidersAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/openai-compatibility", ct);
            response.EnsureSuccessStatusCode();

            // CLIProxyAPI has returned multiple shapes across versions:
            // - A raw array: [ { ...provider... }, ... ]
            // - An object wrapper: { "openai-compatibility": [...] } or { "openai-compatibility": null }
            // Be tolerant.
            var root = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions, ct);
            if (root.ValueKind == JsonValueKind.Array)
            {
                var providers = root.Deserialize<List<OpenAiCompatProviderDto>>(JsonOptions) ?? [];
                return providers.Select(MapProvider).ToList();
            }

            if (root.ValueKind == JsonValueKind.Object)
            {
                if (root.TryGetProperty("openai-compatibility", out var wrapped))
                {
                    if (wrapped.ValueKind == JsonValueKind.Null || wrapped.ValueKind == JsonValueKind.Undefined)
                        return [];

                    if (wrapped.ValueKind == JsonValueKind.Array)
                    {
                        var providers = wrapped.Deserialize<List<OpenAiCompatProviderDto>>(JsonOptions) ?? [];
                        return providers.Select(MapProvider).ToList();
                    }
                }
            }

            return [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get OpenAI-compatible providers");
            return [];
        }
    }

    public async Task<bool> UpsertOpenAiCompatProviderAsync(OpenAiCompatProvider provider, CancellationToken ct = default)
    {
        try
        {
            var dto = new OpenAiCompatProviderDto
            {
                Name = provider.Name,
                BaseUrl = provider.BaseUrl,
                ApiKeyEntries = provider.ApiKeyEntries.Select(e => new OpenAiCompatApiKeyEntryDto
                {
                    ApiKey = e.ApiKey,
                    ProxyUrl = e.ProxyUrl
                }).ToList(),
                Models = provider.Models.Select(m => new OpenAiCompatModelDto
                {
                    Name = m.Name,
                    Alias = m.Alias
                }).ToList(),
                Headers = provider.Headers
            };
            
            var response = await _httpClient.PatchAsJsonAsync(
                "/v0/management/openai-compatibility", 
                dto, 
                JsonOptions, 
                ct);
                
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upsert OpenAI-compatible provider {Name}", provider.Name);
            return false;
        }
    }

    public async Task<bool> DeleteOpenAiCompatProviderAsync(string name, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.DeleteAsync(
                $"/v0/management/openai-compatibility?name={Uri.EscapeDataString(name)}", 
                ct);
                
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete OpenAI-compatible provider {Name}", name);
            return false;
        }
    }

    public async Task<bool?> GetUsageStatisticsEnabledAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/v0/management/usage-statistics-enabled", ct);
            response.EnsureSuccessStatusCode();

            var root = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions, ct);
            if (root.ValueKind == JsonValueKind.Object && 
                root.TryGetProperty("usage-statistics-enabled", out var prop) &&
                (prop.ValueKind == JsonValueKind.True || prop.ValueKind == JsonValueKind.False))
            {
                return prop.GetBoolean();
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get usage statistics enabled status");
            return null;
        }
    }

    public async Task<bool> SetUsageStatisticsEnabledAsync(bool enabled, CancellationToken ct = default)
    {
        try
        {
            var payload = new { value = enabled };
            var response = await _httpClient.PutAsJsonAsync(
                "/v0/management/usage-statistics-enabled",
                payload,
                JsonOptions,
                ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await SafeReadBodyAsync(response, ct);
                _logger.LogError("Failed to set usage statistics enabled: {StatusCode} - {Body}", response.StatusCode, body);
            }

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set usage statistics enabled to {Enabled}", enabled);
            return false;
        }
    }

    private static OpenAiCompatProvider MapProvider(OpenAiCompatProviderDto dto) => new()
    {
        Name = dto.Name ?? "",
        BaseUrl = dto.BaseUrl ?? "",
        ApiKeyEntries = dto.ApiKeyEntries?.Select(e => new OpenAiCompatApiKeyEntry
        {
            ApiKey = e.ApiKey ?? "",
            ProxyUrl = e.ProxyUrl
        }).ToList() ?? [],
        Models = dto.Models?.Select(m => new OpenAiCompatModel
        {
            Name = m.Name ?? "",
            Alias = m.Alias
        }).ToList() ?? [],
        Headers = dto.Headers
    };

    private sealed class OpenAiCompatProviderDto
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        
        [JsonPropertyName("base-url")]
        public string? BaseUrl { get; set; }
        
        [JsonPropertyName("api-key-entries")]
        public List<OpenAiCompatApiKeyEntryDto>? ApiKeyEntries { get; set; }
        
        [JsonPropertyName("models")]
        public List<OpenAiCompatModelDto>? Models { get; set; }
        
        [JsonPropertyName("headers")]
        public Dictionary<string, string>? Headers { get; set; }
    }

    private sealed class OpenAiCompatApiKeyEntryDto
    {
        [JsonPropertyName("api-key")]
        public string? ApiKey { get; set; }
        
        [JsonPropertyName("proxy-url")]
        public string? ProxyUrl { get; set; }
    }

    private sealed class OpenAiCompatModelDto
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        
        [JsonPropertyName("alias")]
        public string? Alias { get; set; }
    }
}
