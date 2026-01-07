namespace KorProxy.Core.Models;

public enum ProxyErrorKind
{
    None = 0,
    ConnectionFailed,
    Unauthorized,
    NotFound,
    Timeout,
    InvalidResponse,
    ConfigurationError,
    ProcessError,
    CircuitOpen,
    Unknown
}
