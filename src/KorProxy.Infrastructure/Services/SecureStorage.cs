using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class SecureStorage : ISecureStorage
{
    private readonly ISecureStorage _primary;
    private readonly ISecureStorage _fallback;

    public SecureStorage(IAppPaths appPaths)
    {
        _fallback = new EncryptedFileStore(appPaths.DataDirectory);

        if (OperatingSystem.IsWindows())
        {
            _primary = new WindowsDpapiStore(appPaths.DataDirectory);
        }
        else if (OperatingSystem.IsMacOS())
        {
            _primary = new MacKeychainStore();
        }
        else
        {
            _primary = _fallback;
        }
    }

    public async Task SaveAsync(string key, string value, CancellationToken ct = default)
    {
        try
        {
            await _primary.SaveAsync(key, value, ct);
        }
        catch
        {
            await _fallback.SaveAsync(key, value, ct);
        }
    }

    public async Task<string?> ReadAsync(string key, CancellationToken ct = default)
    {
        try
        {
            var value = await _primary.ReadAsync(key, ct);
            if (!string.IsNullOrEmpty(value))
                return value;
        }
        catch
        {
            // Fall back below.
        }

        return await _fallback.ReadAsync(key, ct);
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await _primary.DeleteAsync(key, ct);
        }
        catch
        {
            // Ignore primary failures.
        }

        await _fallback.DeleteAsync(key, ct);
    }
}

internal sealed class WindowsDpapiStore : ISecureStorage
{
    private readonly string _path;
    private readonly object _lock = new();

    public WindowsDpapiStore(string dataDirectory)
    {
        _path = Path.Combine(dataDirectory, "secure-store.dpapi.json");
    }

    public Task SaveAsync(string key, string value, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            var bytes = Encoding.UTF8.GetBytes(value);
            var protectedBytes = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
            store[key] = Convert.ToBase64String(protectedBytes);
            SaveStore(store);
        }

        return Task.CompletedTask;
    }

    public Task<string?> ReadAsync(string key, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            if (!store.TryGetValue(key, out var encoded) || string.IsNullOrEmpty(encoded))
                return Task.FromResult<string?>(null);

            var protectedBytes = Convert.FromBase64String(encoded);
            var bytes = ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser);
            return Task.FromResult<string?>(Encoding.UTF8.GetString(bytes));
        }
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            if (store.Remove(key))
                SaveStore(store);
        }

        return Task.CompletedTask;
    }

    private Dictionary<string, string> LoadStore()
    {
        if (!File.Exists(_path))
            return new Dictionary<string, string>(StringComparer.Ordinal);

        var json = File.ReadAllText(_path);
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, string>(StringComparer.Ordinal);

        return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ??
            new Dictionary<string, string>(StringComparer.Ordinal);
    }

    private void SaveStore(Dictionary<string, string> store)
    {
        var json = JsonSerializer.Serialize(store, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_path, json);
    }
}

internal sealed class MacKeychainStore : ISecureStorage
{
    private const string ServiceName = "KorProxy";

    public Task SaveAsync(string key, string value, CancellationToken ct = default)
    {
        DeleteInternal(key);

        var passwordBytes = Encoding.UTF8.GetBytes(value);
        var result = SecKeychainAddGenericPassword(
            IntPtr.Zero,
            (uint)ServiceName.Length,
            ServiceName,
            (uint)key.Length,
            key,
            (uint)passwordBytes.Length,
            passwordBytes,
            out _);

        if (result != 0)
            throw new InvalidOperationException($"Keychain write failed with code {result}.");

        return Task.CompletedTask;
    }

    public Task<string?> ReadAsync(string key, CancellationToken ct = default)
    {
        var result = SecKeychainFindGenericPassword(
            IntPtr.Zero,
            (uint)ServiceName.Length,
            ServiceName,
            (uint)key.Length,
            key,
            out var length,
            out var data,
            out var itemRef);

        if (result != 0)
            return Task.FromResult<string?>(null);

        try
        {
            if (data == IntPtr.Zero || length == 0)
                return Task.FromResult<string?>(null);

            var buffer = new byte[length];
            Marshal.Copy(data, buffer, 0, (int)length);
            return Task.FromResult<string?>(Encoding.UTF8.GetString(buffer));
        }
        finally
        {
            if (data != IntPtr.Zero)
                SecKeychainItemFreeContent(IntPtr.Zero, data);
            if (itemRef != IntPtr.Zero)
                CFRelease(itemRef);
        }
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        DeleteInternal(key);
        return Task.CompletedTask;
    }

    private static void DeleteInternal(string key)
    {
        var result = SecKeychainFindGenericPassword(
            IntPtr.Zero,
            (uint)ServiceName.Length,
            ServiceName,
            (uint)key.Length,
            key,
            out _,
            out var data,
            out var itemRef);

        if (result == 0 && itemRef != IntPtr.Zero)
        {
            SecKeychainItemDelete(itemRef);
            CFRelease(itemRef);
        }

        if (data != IntPtr.Zero)
            SecKeychainItemFreeContent(IntPtr.Zero, data);
    }

    [DllImport("/System/Library/Frameworks/Security.framework/Security")]
    private static extern int SecKeychainFindGenericPassword(
        IntPtr keychain,
        uint serviceNameLength,
        string serviceName,
        uint accountNameLength,
        string accountName,
        out uint passwordLength,
        out IntPtr passwordData,
        out IntPtr itemRef);

    [DllImport("/System/Library/Frameworks/Security.framework/Security")]
    private static extern int SecKeychainAddGenericPassword(
        IntPtr keychain,
        uint serviceNameLength,
        string serviceName,
        uint accountNameLength,
        string accountName,
        uint passwordLength,
        byte[] passwordData,
        out IntPtr itemRef);

    [DllImport("/System/Library/Frameworks/Security.framework/Security")]
    private static extern int SecKeychainItemDelete(IntPtr itemRef);

    [DllImport("/System/Library/Frameworks/Security.framework/Security")]
    private static extern int SecKeychainItemFreeContent(IntPtr attrList, IntPtr data);

    [DllImport("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")]
    private static extern void CFRelease(IntPtr handle);
}

internal sealed class EncryptedFileStore : ISecureStorage
{
    private readonly string _dataPath;
    private readonly string _keyPath;
    private readonly object _lock = new();

    public EncryptedFileStore(string dataDirectory)
    {
        _dataPath = Path.Combine(dataDirectory, "secure-store.aes.json");
        _keyPath = Path.Combine(dataDirectory, "secure-store.key");
    }

    public Task SaveAsync(string key, string value, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            var payload = Encrypt(value);
            store[key] = payload;
            SaveStore(store);
        }

        return Task.CompletedTask;
    }

    public Task<string?> ReadAsync(string key, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            if (!store.TryGetValue(key, out var payload))
                return Task.FromResult<string?>(null);

            try
            {
                return Task.FromResult<string?>(Decrypt(payload));
            }
            catch
            {
                return Task.FromResult<string?>(null);
            }
        }
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var store = LoadStore();
            if (store.Remove(key))
                SaveStore(store);
        }

        return Task.CompletedTask;
    }

    private Dictionary<string, StoredSecret> LoadStore()
    {
        if (!File.Exists(_dataPath))
            return new Dictionary<string, StoredSecret>(StringComparer.Ordinal);

        var json = File.ReadAllText(_dataPath);
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, StoredSecret>(StringComparer.Ordinal);

        return JsonSerializer.Deserialize<Dictionary<string, StoredSecret>>(json) ??
            new Dictionary<string, StoredSecret>(StringComparer.Ordinal);
    }

    private void SaveStore(Dictionary<string, StoredSecret> store)
    {
        var json = JsonSerializer.Serialize(store, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_dataPath, json);
    }

    private StoredSecret Encrypt(string value)
    {
        var key = GetKey();
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plaintext = Encoding.UTF8.GetBytes(value);
        var cipher = new byte[plaintext.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(key);
        aes.Encrypt(nonce, plaintext, cipher, tag);

        return new StoredSecret(
            Convert.ToBase64String(nonce),
            Convert.ToBase64String(cipher),
            Convert.ToBase64String(tag));
    }

    private string Decrypt(StoredSecret payload)
    {
        var key = GetKey();
        var nonce = Convert.FromBase64String(payload.Nonce);
        var cipher = Convert.FromBase64String(payload.Ciphertext);
        var tag = Convert.FromBase64String(payload.Tag);
        var plaintext = new byte[cipher.Length];

        using var aes = new AesGcm(key);
        aes.Decrypt(nonce, cipher, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }

    private byte[] GetKey()
    {
        if (File.Exists(_keyPath))
        {
            var encoded = File.ReadAllText(_keyPath);
            return Convert.FromBase64String(encoded);
        }

        var key = RandomNumberGenerator.GetBytes(32);
        File.WriteAllText(_keyPath, Convert.ToBase64String(key));
        return key;
    }

    private sealed record StoredSecret(string Nonce, string Ciphertext, string Tag);
}
