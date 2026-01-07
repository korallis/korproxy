using System.Net.Http.Headers;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class ManagementKeyAuthHandler : DelegatingHandler
{
    private readonly IManagementKeyProvider _keyProvider;

    public ManagementKeyAuthHandler(IManagementKeyProvider keyProvider)
    {
        _keyProvider = keyProvider;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var key = await _keyProvider.GetOrCreateKeyAsync(cancellationToken);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        return await base.SendAsync(request, cancellationToken);
    }
}
