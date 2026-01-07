using System.Security.Cryptography;
using System.Text.RegularExpressions;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

public sealed partial class ManagementKeyProvider : IManagementKeyProvider
{
    private const string StorageKey = "management-key";
    private const int KeySizeBytes = 32;

    private readonly ISecureStorage _secureStorage;
    private readonly IAppPaths _appPaths;
    private readonly ILogger<ManagementKeyProvider> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private string? _cachedKey;

    public ManagementKeyProvider(
        ISecureStorage secureStorage,
        IAppPaths appPaths,
        ILogger<ManagementKeyProvider> logger)
    {
        _secureStorage = secureStorage;
        _appPaths = appPaths;
        _logger = logger;
    }

    public async Task<string?> GetKeyAsync(CancellationToken ct = default)
    {
        if (_cachedKey != null)
            return _cachedKey;

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedKey != null)
                return _cachedKey;

            var key = await _secureStorage.ReadAsync(StorageKey, ct);
            if (!string.IsNullOrEmpty(key))
            {
                _cachedKey = key;
                return key;
            }

            return null;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<string> GetOrCreateKeyAsync(CancellationToken ct = default)
    {
        if (_cachedKey != null)
            return _cachedKey;

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedKey != null)
                return _cachedKey;

            var key = await _secureStorage.ReadAsync(StorageKey, ct);
            if (!string.IsNullOrEmpty(key))
            {
                _cachedKey = key;
                return key;
            }

            var configKey = TryReadKeyFromConfig();
            if (!string.IsNullOrEmpty(configKey))
            {
                _logger.LogInformation("Migrating management key from config file to secure storage");
                await _secureStorage.SaveAsync(StorageKey, configKey, ct);
                _cachedKey = configKey;
                return configKey;
            }

            var newKey = GenerateSecureKey();
            _logger.LogInformation("Generated new secure management key");
            await _secureStorage.SaveAsync(StorageKey, newKey, ct);
            _cachedKey = newKey;
            return newKey;
        }
        finally
        {
            _lock.Release();
        }
    }

    private string? TryReadKeyFromConfig()
    {
        try
        {
            var configPath = _appPaths.ConfigFilePath;
            if (!File.Exists(configPath))
                return null;

            var content = File.ReadAllText(configPath);
            var match = SecretKeyRegex().Match(content);
            if (match.Success)
            {
                var key = match.Groups[1].Value;
                // Skip empty, default key, and bcrypt hashes (CLIProxyAPI hashes the key on startup)
                if (!string.IsNullOrEmpty(key) && 
                    key != "korproxy-mgmt-key" && 
                    !key.StartsWith("$2a$") && 
                    !key.StartsWith("$2b$"))
                    return key;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read management key from config file");
            return null;
        }
    }

    private static string GenerateSecureKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(KeySizeBytes);
        return Base64UrlEncode(bytes);
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    [GeneratedRegex(@"secret-key:\s*""([^""]+)""", RegexOptions.Compiled)]
    private static partial Regex SecretKeyRegex();
}
