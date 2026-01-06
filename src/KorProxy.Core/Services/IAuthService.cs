using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IAuthService
{
    AuthSession? CurrentSession { get; }
    event EventHandler<AuthSession?>? SessionChanged;

    Task<AuthSession?> LoadSessionAsync(CancellationToken ct = default);
    Task<AuthResult> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<AuthResult> RegisterAsync(string email, string password, string? name, CancellationToken ct = default);
    Task LogoutAsync(CancellationToken ct = default);
    Task<AuthSession?> ValidateSessionAsync(CancellationToken ct = default);
    Task<AuthSession?> RefreshSessionAsync(CancellationToken ct = default);
    Task<bool> TryImportLegacySessionAsync(CancellationToken ct = default);
}
