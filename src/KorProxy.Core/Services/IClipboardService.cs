namespace KorProxy.Core.Services;

public interface IClipboardService
{
    Task SetTextAsync(string text);
    Task<string?> GetTextAsync();
    Task CopyWithFeedbackAsync(string text, string successMessage = "Copied to clipboard");
}
