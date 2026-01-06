namespace KorProxy.Services;

/// <summary>
/// Result of a dialog with confirm/cancel options.
/// </summary>
public enum DialogResult
{
    Cancel,
    Confirm
}

/// <summary>
/// Service for showing dialog boxes (message boxes, confirmations, etc.)
/// </summary>
public interface IDialogService
{
    /// <summary>
    /// Shows an information message dialog.
    /// </summary>
    Task ShowInfoAsync(string title, string message);

    /// <summary>
    /// Shows a warning message dialog.
    /// </summary>
    Task ShowWarningAsync(string title, string message);

    /// <summary>
    /// Shows an error message dialog.
    /// </summary>
    Task ShowErrorAsync(string title, string message);

    /// <summary>
    /// Shows a confirmation dialog with Yes/No buttons.
    /// </summary>
    /// <returns>True if user clicked Yes/Confirm, false otherwise.</returns>
    Task<bool> ShowConfirmAsync(string title, string message);

    /// <summary>
    /// Shows a confirmation dialog with custom button text.
    /// </summary>
    /// <returns>DialogResult indicating user's choice.</returns>
    Task<DialogResult> ShowConfirmAsync(string title, string message, string confirmText, string cancelText);
}
