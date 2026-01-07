using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using KorProxy.Core.Services;
using KorProxy.Infrastructure.Serialization;

namespace KorProxy.Infrastructure.Services;

public sealed class ConvexHttpClient : IConvexApiClient
{
    private readonly HttpClient _httpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters =
        {
            new LenientNullableInt64JsonConverter()
        }
    };

    public ConvexHttpClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public Task<T?> QueryAsync<T>(string path, object args, CancellationToken ct = default)
        => SendAsync<T>("/api/query", path, args, ct);

    public Task<T?> MutationAsync<T>(string path, object args, CancellationToken ct = default)
        => SendAsync<T>("/api/mutation", path, args, ct);
    
    public Task<T?> ActionAsync<T>(string path, object args, CancellationToken ct = default)
        => SendAsync<T>("/api/action", path, args, ct);

    private async Task<T?> SendAsync<T>(string endpoint, string path, object args, CancellationToken ct)
    {
        // Convex HTTP API expects: { "path": "module:function", "args": {...} }
        var payload = new ConvexRequest(path, args);
        using var response = await _httpClient.PostAsJsonAsync(endpoint, payload, JsonOptions, ct);

        var body = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("Empty Convex response.");

        var envelope = JsonSerializer.Deserialize<ConvexResponse<JsonElement>>(body, JsonOptions);
        if (envelope == null)
            throw new InvalidOperationException("Failed to parse Convex response.");

        if (!string.Equals(envelope.Status, "success", StringComparison.OrdinalIgnoreCase))
        {
            var message = envelope.ErrorMessage ?? "Convex request failed.";
            throw new InvalidOperationException(message);
        }

        if (envelope.Value.ValueKind == JsonValueKind.Null || envelope.Value.ValueKind == JsonValueKind.Undefined)
            return default;

        return envelope.Value.Deserialize<T>(JsonOptions);
    }

    private sealed record ConvexRequest(
        [property: JsonPropertyName("path")] string Path, 
        [property: JsonPropertyName("args")] object Args);

    private sealed record ConvexResponse<T>(
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("value")] T? Value,
        [property: JsonPropertyName("errorMessage")] string? ErrorMessage,
        [property: JsonPropertyName("errorData")] object? ErrorData);
}
