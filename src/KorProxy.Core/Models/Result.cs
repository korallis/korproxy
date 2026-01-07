namespace KorProxy.Core.Models;

public readonly struct Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; }
    public ProxyErrorKind ErrorKind { get; }

    private Result(bool isSuccess, string? error, ProxyErrorKind errorKind)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorKind = errorKind;
    }

    public static Result Success() => new(true, null, ProxyErrorKind.None);

    public static Result Failure(string error) => new(false, error, ProxyErrorKind.Unknown);

    public static Result Failure(ProxyErrorKind errorKind, string message) =>
        new(false, message, errorKind);

    public static Result<T> Success<T>(T value) => Result<T>.Success(value);

    public static Result<T> Failure<T>(string error) => Result<T>.Failure(error);

    public static Result<T> Failure<T>(ProxyErrorKind errorKind, string message) =>
        Result<T>.Failure(errorKind, message);
}

public readonly struct Result<T>
{
    private readonly T? _value;

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; }
    public ProxyErrorKind ErrorKind { get; }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException($"Cannot access Value on a failed result. Error: {Error}");

    private Result(bool isSuccess, T? value, string? error, ProxyErrorKind errorKind)
    {
        IsSuccess = isSuccess;
        _value = value;
        Error = error;
        ErrorKind = errorKind;
    }

    public static Result<T> Success(T value) => new(true, value, null, ProxyErrorKind.None);

    public static Result<T> Failure(string error) => new(false, default, error, ProxyErrorKind.Unknown);

    public static Result<T> Failure(ProxyErrorKind errorKind, string message) =>
        new(false, default, message, errorKind);

    public T GetValueOrDefault(T defaultValue) => IsSuccess ? _value! : defaultValue;

    public Result<TNew> Map<TNew>(Func<T, TNew> mapper) =>
        IsSuccess
            ? Result<TNew>.Success(mapper(_value!))
            : Result<TNew>.Failure(ErrorKind, Error ?? "Unknown error");

    public async Task<Result<TNew>> MapAsync<TNew>(Func<T, Task<TNew>> mapper) =>
        IsSuccess
            ? Result<TNew>.Success(await mapper(_value!))
            : Result<TNew>.Failure(ErrorKind, Error ?? "Unknown error");

    public Result<TNew> Bind<TNew>(Func<T, Result<TNew>> binder) =>
        IsSuccess ? binder(_value!) : Result<TNew>.Failure(ErrorKind, Error ?? "Unknown error");

    public async Task<Result<TNew>> BindAsync<TNew>(Func<T, Task<Result<TNew>>> binder) =>
        IsSuccess ? await binder(_value!) : Result<TNew>.Failure(ErrorKind, Error ?? "Unknown error");

    public void Match(Action<T> onSuccess, Action<string, ProxyErrorKind> onFailure)
    {
        if (IsSuccess)
            onSuccess(_value!);
        else
            onFailure(Error ?? "Unknown error", ErrorKind);
    }

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<string, ProxyErrorKind, TResult> onFailure) =>
        IsSuccess ? onSuccess(_value!) : onFailure(Error ?? "Unknown error", ErrorKind);

    public static implicit operator Result(Result<T> result) =>
        result.IsSuccess ? Result.Success() : Result.Failure(result.ErrorKind, result.Error ?? "Unknown error");
}
