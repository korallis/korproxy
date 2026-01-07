using KorProxy.Core.Models;
using Xunit;

namespace KorProxy.Tests;

public class ResultTests
{
    [Fact]
    public void Success_CreatesSuccessfulResult()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Null(result.Error);
        Assert.Equal(ProxyErrorKind.None, result.ErrorKind);
    }

    [Fact]
    public void Failure_WithMessage_CreatesFailedResult()
    {
        var result = Result.Failure("Something went wrong");

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal("Something went wrong", result.Error);
        Assert.Equal(ProxyErrorKind.Unknown, result.ErrorKind);
    }

    [Fact]
    public void Failure_WithErrorKind_SetsCorrectKind()
    {
        var result = Result.Failure(ProxyErrorKind.ConnectionFailed, "Connection failed");

        Assert.True(result.IsFailure);
        Assert.Equal(ProxyErrorKind.ConnectionFailed, result.ErrorKind);
        Assert.Equal("Connection failed", result.Error);
    }
}

public class ResultOfTTests
{
    [Fact]
    public void Success_CreatesSuccessfulResultWithValue()
    {
        var result = Result<int>.Success(42);

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(42, result.Value);
        Assert.Equal(ProxyErrorKind.None, result.ErrorKind);
    }

    [Fact]
    public void Success_WithNullValue_StoresNull()
    {
        var result = Result<string?>.Success(null);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value);
    }

    [Fact]
    public void Failure_AccessingValue_ThrowsException()
    {
        var result = Result<int>.Failure("Error occurred");

        var ex = Assert.Throws<InvalidOperationException>(() => result.Value);
        Assert.Contains("Error occurred", ex.Message);
    }

    [Fact]
    public void GetValueOrDefault_OnSuccess_ReturnsValue()
    {
        var result = Result<int>.Success(100);

        Assert.Equal(100, result.GetValueOrDefault(0));
    }

    [Fact]
    public void GetValueOrDefault_OnFailure_ReturnsDefault()
    {
        var result = Result<int>.Failure("failed");

        Assert.Equal(999, result.GetValueOrDefault(999));
    }

    [Fact]
    public void Map_OnSuccess_TransformsValue()
    {
        var result = Result<int>.Success(10);

        var mapped = result.Map(x => x * 2);

        Assert.True(mapped.IsSuccess);
        Assert.Equal(20, mapped.Value);
    }

    [Fact]
    public void Map_OnFailure_PropagatesError()
    {
        var result = Result<int>.Failure(ProxyErrorKind.Unauthorized, "auth failed");

        var mapped = result.Map(x => x * 2);

        Assert.True(mapped.IsFailure);
        Assert.Equal("auth failed", mapped.Error);
        Assert.Equal(ProxyErrorKind.Unauthorized, mapped.ErrorKind);
    }

    [Fact]
    public void Bind_OnSuccess_ChainsOperation()
    {
        var result = Result<int>.Success(5);

        var bound = result.Bind(x => Result<string>.Success($"Value is {x}"));

        Assert.True(bound.IsSuccess);
        Assert.Equal("Value is 5", bound.Value);
    }

    [Fact]
    public void Bind_OnSuccess_PropagatesInnerFailure()
    {
        var result = Result<int>.Success(5);

        var bound = result.Bind(x => Result<string>.Failure("inner failure"));

        Assert.True(bound.IsFailure);
        Assert.Equal("inner failure", bound.Error);
    }

    [Fact]
    public void Bind_OnFailure_PropagatesOuterError()
    {
        var result = Result<int>.Failure(ProxyErrorKind.Timeout, "timed out");

        var bound = result.Bind(x => Result<string>.Success("never reached"));

        Assert.True(bound.IsFailure);
        Assert.Equal("timed out", bound.Error);
        Assert.Equal(ProxyErrorKind.Timeout, bound.ErrorKind);
    }

    [Fact]
    public void Match_OnSuccess_CallsSuccessHandler()
    {
        var result = Result<int>.Success(42);
        var successCalled = false;

        result.Match(
            onSuccess: v => successCalled = v == 42,
            onFailure: (_, _) => { });

        Assert.True(successCalled);
    }

    [Fact]
    public void Match_OnFailure_CallsFailureHandler()
    {
        var result = Result<int>.Failure(ProxyErrorKind.ConfigurationError, "bad config");
        string? capturedError = null;
        ProxyErrorKind? capturedKind = null;

        result.Match(
            onSuccess: _ => { },
            onFailure: (err, kind) =>
            {
                capturedError = err;
                capturedKind = kind;
            });

        Assert.Equal("bad config", capturedError);
        Assert.Equal(ProxyErrorKind.ConfigurationError, capturedKind);
    }

    [Fact]
    public void MatchWithReturn_OnSuccess_ReturnsTransformed()
    {
        var result = Result<int>.Success(10);

        var output = result.Match(
            onSuccess: v => $"Got {v}",
            onFailure: (_, _) => "Failed");

        Assert.Equal("Got 10", output);
    }

    [Fact]
    public void MatchWithReturn_OnFailure_ReturnsFailureValue()
    {
        var result = Result<int>.Failure("oops");

        var output = result.Match(
            onSuccess: v => $"Got {v}",
            onFailure: (err, _) => $"Error: {err}");

        Assert.Equal("Error: oops", output);
    }

    [Fact]
    public void ImplicitConversion_ToNonGenericResult()
    {
        Result<int> typedSuccess = Result<int>.Success(1);
        Result<int> typedFailure = Result<int>.Failure(ProxyErrorKind.ProcessError, "crashed");

        Result success = typedSuccess;
        Result failure = typedFailure;

        Assert.True(success.IsSuccess);
        Assert.True(failure.IsFailure);
        Assert.Equal(ProxyErrorKind.ProcessError, failure.ErrorKind);
    }

    [Fact]
    public async Task MapAsync_OnSuccess_TransformsValue()
    {
        var result = Result<int>.Success(5);

        var mapped = await result.MapAsync(async x =>
        {
            await Task.Delay(1);
            return x * 3;
        });

        Assert.True(mapped.IsSuccess);
        Assert.Equal(15, mapped.Value);
    }

    [Fact]
    public async Task MapAsync_OnFailure_PropagatesError()
    {
        var result = Result<int>.Failure("async error");

        var mapped = await result.MapAsync(async x =>
        {
            await Task.Delay(1);
            return x * 3;
        });

        Assert.True(mapped.IsFailure);
        Assert.Equal("async error", mapped.Error);
    }

    [Fact]
    public async Task BindAsync_OnSuccess_ChainsAsync()
    {
        var result = Result<int>.Success(7);

        var bound = await result.BindAsync(async x =>
        {
            await Task.Delay(1);
            return Result<string>.Success($"async {x}");
        });

        Assert.True(bound.IsSuccess);
        Assert.Equal("async 7", bound.Value);
    }

    [Fact]
    public async Task BindAsync_OnFailure_PropagatesError()
    {
        var result = Result<int>.Failure("bind async fail");

        var bound = await result.BindAsync(async x =>
        {
            await Task.Delay(1);
            return Result<string>.Success("never");
        });

        Assert.True(bound.IsFailure);
        Assert.Equal("bind async fail", bound.Error);
    }

    [Fact]
    public void FactoryMethods_FromResultClass_CreateCorrectTypes()
    {
        var success = Result.Success(42);
        var failure = Result.Failure<int>("error");
        var errorKindFailure = Result.Failure<int>(ProxyErrorKind.Timeout, "timeout");

        Assert.True(success.IsSuccess);
        Assert.Equal(42, success.Value);

        Assert.True(failure.IsFailure);
        Assert.Equal("error", failure.Error);

        Assert.True(errorKindFailure.IsFailure);
        Assert.Equal(ProxyErrorKind.Timeout, errorKindFailure.ErrorKind);
    }
}
