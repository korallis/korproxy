using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;
using YamlDotNet.Core;
using YamlDotNet.RepresentationModel;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace KorProxy.Infrastructure.Services;

public sealed class ProxyConfigStore : IProxyConfigStore
{
    private readonly IAppPaths _appPaths;
    private readonly ILogger<ProxyConfigStore> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private static readonly IDeserializer Deserializer = new DeserializerBuilder()
        .WithNamingConvention(UnderscoredNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    private static readonly ISerializer Serializer = new SerializerBuilder()
        .WithNamingConvention(UnderscoredNamingConvention.Instance)
        .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitDefaults)
        .Build();

    public ProxyConfigStore(IAppPaths appPaths, ILogger<ProxyConfigStore> logger)
    {
        _appPaths = appPaths;
        _logger = logger;
    }

    public async Task<ProxyConfigFile?> LoadAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            var path = _appPaths.ConfigFilePath;
            if (!File.Exists(path))
            {
                _logger.LogDebug("Config file not found at {Path}", path);
                return null;
            }

            var yaml = await File.ReadAllTextAsync(path, ct);
            var config = Deserializer.Deserialize<ProxyConfigFile>(yaml);
            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load config from {Path}", _appPaths.ConfigFilePath);
            return null;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> SaveAsync(ProxyConfigFile config, CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            var path = _appPaths.ConfigFilePath;
            var existingNodes = new Dictionary<string, YamlNode>();

            if (File.Exists(path))
            {
                try
                {
                    var existingYaml = await File.ReadAllTextAsync(path, ct);
                    var yamlStream = new YamlStream();
                    using var reader = new StringReader(existingYaml);
                    yamlStream.Load(reader);

                    if (yamlStream.Documents.Count > 0 && 
                        yamlStream.Documents[0].RootNode is YamlMappingNode rootNode)
                    {
                        foreach (var entry in rootNode.Children)
                        {
                            if (entry.Key is YamlScalarNode keyNode && keyNode.Value != null)
                            {
                                existingNodes[keyNode.Value] = entry.Value;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not parse existing config for preservation");
                }
            }

            var newYaml = Serializer.Serialize(config);
            var newStream = new YamlStream();
            using (var reader = new StringReader(newYaml))
            {
                newStream.Load(reader);
            }

            var knownKeys = new HashSet<string>
            {
                "host", "port", "auth_dir", "api_keys", "remote_management",
                "debug", "logging_to_file", "usage_statistics_enabled",
                "request_retry", "max_retry_interval"
            };

            if (newStream.Documents.Count > 0 && 
                newStream.Documents[0].RootNode is YamlMappingNode newRootNode)
            {
                foreach (var (key, value) in existingNodes)
                {
                    if (!knownKeys.Contains(key))
                    {
                        newRootNode.Children.Add(new YamlScalarNode(key), value);
                    }
                }
            }

            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            using (var writer = new StreamWriter(path))
            {
                newStream.Save(writer, assignAnchors: false);
            }

            _logger.LogDebug("Saved config to {Path}", path);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save config to {Path}", _appPaths.ConfigFilePath);
            return false;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<int> GetPortAsync(CancellationToken ct = default)
    {
        var config = await LoadAsync(ct);
        return config?.Port ?? 8317;
    }

    public async Task<bool> SetPortAsync(int port, CancellationToken ct = default)
    {
        var config = await LoadAsync(ct) ?? new ProxyConfigFile();
        config.Port = port;
        return await SaveAsync(config, ct);
    }

    public async Task<bool> GetUsageStatisticsEnabledAsync(CancellationToken ct = default)
    {
        var config = await LoadAsync(ct);
        return config?.UsageStatisticsEnabled ?? true;
    }

    public async Task<bool> SetUsageStatisticsEnabledAsync(bool enabled, CancellationToken ct = default)
    {
        var config = await LoadAsync(ct) ?? new ProxyConfigFile();
        config.UsageStatisticsEnabled = enabled;
        return await SaveAsync(config, ct);
    }

    public async Task<bool> GetDebugAsync(CancellationToken ct = default)
    {
        var config = await LoadAsync(ct);
        return config?.Debug ?? false;
    }

    public async Task<bool> SetDebugAsync(bool debug, CancellationToken ct = default)
    {
        var config = await LoadAsync(ct) ?? new ProxyConfigFile();
        config.Debug = debug;
        return await SaveAsync(config, ct);
    }

    public async Task<List<string>> GetApiKeysAsync(CancellationToken ct = default)
    {
        var config = await LoadAsync(ct);
        return config?.ApiKeys ?? new List<string>();
    }

    public async Task<bool> SetApiKeysAsync(List<string> apiKeys, CancellationToken ct = default)
    {
        var config = await LoadAsync(ct) ?? new ProxyConfigFile();
        config.ApiKeys = apiKeys;
        return await SaveAsync(config, ct);
    }
}
