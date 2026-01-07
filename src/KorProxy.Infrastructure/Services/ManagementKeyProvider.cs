using System.Security.Cryptography;
using System.Text.RegularExpressions;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Provides the management API secret key by reading/writing directly to the config file.
/// This matches how CLIProxyAPI handles the key - no Keychain or secure storage needed.
/// </summary>
public sealed partial class ManagementKeyProvider : IManagementKeyProvider
{
    private const int KeySizeBytes = 32;

    private readonly IAppPaths _appPaths;
    private readonly ILogger<ManagementKeyProvider> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private string? _cachedKey;

    public ManagementKeyProvider(IAppPaths appPaths, ILogger<ManagementKeyProvider> logger)
    {
        _appPaths = appPaths;
        _logger = logger;
    }

    public Task<string?> GetKeyAsync(CancellationToken ct = default)
    {
        if (_cachedKey != null)
            return Task.FromResult<string?>(_cachedKey);

        var key = ReadKeyFromConfig();
        if (!string.IsNullOrEmpty(key))
        {
            _cachedKey = key;
            return Task.FromResult<string?>(_cachedKey);
        }

        return Task.FromResult<string?>(null);
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

            var existingKey = ReadKeyFromConfig();
            if (!string.IsNullOrEmpty(existingKey))
            {
                _logger.LogDebug("Using existing management key from config file");
                _cachedKey = existingKey;
                return existingKey;
            }

            _logger.LogInformation("No management key found in config, generating new key");
            var newKey = GenerateSecureKey();
            _cachedKey = newKey;
            return newKey;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Reads the plaintext secret-key from config. Returns null if not found or if it's already hashed.
    /// </summary>
    private string? ReadKeyFromConfig()
    {
        try
        {
            var configPath = _appPaths.ConfigFilePath;
            if (!File.Exists(configPath))
            {
                _logger.LogDebug("Config file does not exist at {Path}", configPath);
                return null;
            }

            var content = File.ReadAllText(configPath);
            var match = SecretKeyRegex().Match(content);

            if (!match.Success)
            {
                _logger.LogDebug("No secret-key found in config file");
                return null;
            }

            var key = match.Groups[1].Value;

            if (string.IsNullOrEmpty(key))
            {
                _logger.LogDebug("Secret-key in config is empty");
                return null;
            }

            if (key == "korproxy-mgmt-key")
            {
                _logger.LogDebug("Config contains default placeholder key");
                return null;
            }

            // CLIProxyAPI hashes the key with bcrypt on startup.
            // If we see a bcrypt hash, it means the proxy already ran and we can't recover the plaintext.
            // This is fine - we'll generate a new key and update the config.
            if (key.StartsWith("$2a$") || key.StartsWith("$2b$"))
            {
                _logger.LogWarning(
                    "Config contains bcrypt-hashed key. The plaintext key was lost. " +
                    "This can happen if the app was updated or reinstalled. " +
                    "A new key will be generated.");
                return null;
            }

            _logger.LogDebug("Found plaintext management key in config");
            return key;
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
