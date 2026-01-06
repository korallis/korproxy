using System.Collections.ObjectModel;
using System.Runtime.InteropServices;
using Avalonia.Platform.Storage;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Services;
using KorProxy.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KorProxy.ViewModels;

public partial class SupportViewModel : ViewModelBase
{
    private readonly ISupportTicketService? _ticketService;
    private readonly IDialogService? _dialogService;

    // New ticket form
    [ObservableProperty]
    private string _subject = "";

    [ObservableProperty]
    private string _description = "";

    [ObservableProperty]
    private bool _includeDiagnostics = true;

    [ObservableProperty]
    private string _selectedPriority = "Normal";

    // File attachments
    [ObservableProperty]
    private ObservableCollection<AttachedFileItem> _attachedFiles = [];

    // Ticket list
    [ObservableProperty]
    private ObservableCollection<SupportTicketItem> _tickets = [];

    [ObservableProperty]
    private SupportTicketItem? _selectedTicket;

    // View state
    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isSubmitting;

    [ObservableProperty]
    private bool _isSyncing;

    [ObservableProperty]
    private string? _statusMessage;

    [ObservableProperty]
    private bool _showNewTicketForm = true;

    [ObservableProperty]
    private string _replyMessage = "";

    [ObservableProperty]
    private string? _lastSyncMessage;

    public string[] PriorityOptions { get; } = ["Low", "Normal", "High", "Urgent"];

    public string SystemInfo => $"{RuntimeInformation.OSDescription} ({RuntimeInformation.OSArchitecture})";

    public string AppVersion
    {
        get
        {
            var assembly = System.Reflection.Assembly.GetEntryAssembly();
            var version = assembly?.GetName().Version;
            return version?.ToString(3) ?? "0.0.0";
        }
    }

    // Maximum file size (5MB)
    private const long MaxFileSize = 5 * 1024 * 1024;
    
    // Maximum number of attachments
    private const int MaxAttachments = 5;

    [ActivatorUtilitiesConstructor]
    public SupportViewModel(ISupportTicketService ticketService, IDialogService dialogService)
    {
        _ticketService = ticketService;
        _dialogService = dialogService;
    }

    // Design-time constructor
    public SupportViewModel()
    {
        _ticketService = null;
        _dialogService = null;
        Tickets =
        [
            new SupportTicketItem
            {
                Id = "1",
                Subject = "Sample ticket",
                Status = "Open",
                CreatedAt = "Jan 1, 2026",
                GitHubIssueUrl = "https://github.com/KorProxy/support-tickets/issues/1"
            }
        ];
        AttachedFiles =
        [
            new AttachedFileItem { FileName = "screenshot.png", FileSize = "128 KB" }
        ];
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await LoadTicketsAsync();
    }

    [RelayCommand]
    private async Task LoadTicketsAsync()
    {
        if (_ticketService == null) return;

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var tickets = await _ticketService.GetMyTicketsAsync();
            Tickets = new ObservableCollection<SupportTicketItem>(
                tickets.Select(t => new SupportTicketItem
                {
                    Id = t.Id,
                    Subject = t.Subject,
                    Status = FormatStatus(t.Status),
                    StatusColor = GetStatusColor(t.Status),
                    CreatedAt = t.CreatedAt.ToString("MMM d, yyyy"),
                    HasNewReply = t.LastResponseBy == "support" && 
                                  t.LastResponseAt > t.CreatedAt,
                    GitHubIssueUrl = t.GitHubIssueUrl,
                    GitHubIssueNumber = t.GitHubIssueNumber
                })
            );
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to load tickets: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AttachFilesAsync()
    {
        if (_dialogService == null) return;

        if (AttachedFiles.Count >= MaxAttachments)
        {
            StatusMessage = $"Maximum {MaxAttachments} files allowed";
            return;
        }

        try
        {
            var files = await _dialogService.OpenFilePickerAsync(new FilePickerOpenOptions
            {
                Title = "Attach Files",
                AllowMultiple = true,
                FileTypeFilter =
                [
                    new FilePickerFileType("All Files") { Patterns = ["*"] },
                    new FilePickerFileType("Images") { Patterns = ["*.png", "*.jpg", "*.jpeg", "*.gif"] },
                    new FilePickerFileType("Logs") { Patterns = ["*.log", "*.txt"] }
                ]
            });

            if (files == null || files.Count == 0) return;

            foreach (var file in files)
            {
                if (AttachedFiles.Count >= MaxAttachments)
                {
                    StatusMessage = $"Maximum {MaxAttachments} files allowed";
                    break;
                }

                var props = await file.GetBasicPropertiesAsync();
                var size = (long)(props.Size ?? 0);

                if (size > MaxFileSize)
                {
                    StatusMessage = $"File '{file.Name}' exceeds 5MB limit";
                    continue;
                }

                // Read file and convert to base64
                await using var stream = await file.OpenReadAsync();
                using var memoryStream = new MemoryStream();
                await stream.CopyToAsync(memoryStream);
                var base64Data = Convert.ToBase64String(memoryStream.ToArray());

                // Determine MIME type
                var mimeType = GetMimeType(file.Name);

                AttachedFiles.Add(new AttachedFileItem
                {
                    FileName = file.Name,
                    FileSize = FormatFileSize(size),
                    FileSizeBytes = size,
                    MimeType = mimeType,
                    Base64Data = base64Data
                });
            }

            StatusMessage = null;
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to attach files: {ex.Message}";
        }
    }

    [RelayCommand]
    private void RemoveAttachment(AttachedFileItem? file)
    {
        if (file != null)
        {
            AttachedFiles.Remove(file);
        }
    }

    [RelayCommand]
    private async Task SubmitTicketAsync()
    {
        if (_ticketService == null) return;

        if (string.IsNullOrWhiteSpace(Subject))
        {
            StatusMessage = "Please enter a subject";
            return;
        }

        if (string.IsNullOrWhiteSpace(Description))
        {
            StatusMessage = "Please describe your issue";
            return;
        }

        IsSubmitting = true;
        StatusMessage = null;

        try
        {
            var priority = SelectedPriority switch
            {
                "Low" => SupportTicketPriority.Low,
                "High" => SupportTicketPriority.High,
                "Urgent" => SupportTicketPriority.Urgent,
                _ => SupportTicketPriority.Normal
            };

            // Convert attached files to service format
            var attachments = AttachedFiles.Select(f => new SupportTicketAttachment
            {
                FileName = f.FileName,
                FileSize = f.FileSizeBytes,
                MimeType = f.MimeType,
                Data = f.Base64Data
            }).ToList();

            var result = await _ticketService.CreateTicketWithAttachmentsAsync(
                Subject,
                Description,
                IncludeDiagnostics,
                attachments,
                priority);

            if (result.Success)
            {
                var message = "Ticket submitted successfully!";
                if (!string.IsNullOrWhiteSpace(result.GitHubIssueUrl))
                {
                    message += " A GitHub issue has been created for tracking.";
                }
                StatusMessage = message;
                
                // Clear form
                Subject = "";
                Description = "";
                SelectedPriority = "Normal";
                IncludeDiagnostics = true;
                AttachedFiles.Clear();

                // Refresh ticket list
                await LoadTicketsAsync();
            }
            else
            {
                StatusMessage = result.Error ?? "Failed to submit ticket";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to submit ticket: {ex.Message}";
        }
        finally
        {
            IsSubmitting = false;
        }
    }

    [RelayCommand]
    private async Task SyncTicketsAsync()
    {
        if (_ticketService == null) return;

        IsSyncing = true;
        LastSyncMessage = null;

        try
        {
            var result = await _ticketService.SyncTicketsAsync();

            if (result.Success)
            {
                if (result.NewComments > 0)
                {
                    LastSyncMessage = $"Synced {result.NewComments} new response(s)";
                    // Refresh the ticket list
                    await LoadTicketsAsync();
                    // If we have a selected ticket, refresh it
                    if (SelectedTicket != null)
                    {
                        await ViewTicketAsync(SelectedTicket);
                    }
                }
                else
                {
                    LastSyncMessage = "No new responses";
                }
            }
            else
            {
                LastSyncMessage = result.Error ?? "Sync failed";
            }
        }
        catch (Exception ex)
        {
            LastSyncMessage = $"Sync failed: {ex.Message}";
        }
        finally
        {
            IsSyncing = false;
        }
    }

    [RelayCommand]
    private async Task ViewTicketAsync(SupportTicketItem? ticket)
    {
        if (_ticketService == null || ticket == null) return;

        IsLoading = true;
        ShowNewTicketForm = false;

        try
        {
            var fullTicket = await _ticketService.GetTicketAsync(ticket.Id);
            if (fullTicket != null)
            {
                SelectedTicket = new SupportTicketItem
                {
                    Id = fullTicket.Id,
                    Subject = fullTicket.Subject,
                    Body = fullTicket.Body,
                    Status = FormatStatus(fullTicket.Status),
                    StatusColor = GetStatusColor(fullTicket.Status),
                    CreatedAt = fullTicket.CreatedAt.ToString("MMMM d, yyyy 'at' h:mm tt"),
                    GitHubIssueUrl = fullTicket.GitHubIssueUrl,
                    GitHubIssueNumber = fullTicket.GitHubIssueNumber,
                    Attachments = fullTicket.Attachments.Select(a => new AttachedFileItem
                    {
                        FileName = a.FileName,
                        FileSize = FormatFileSize(a.FileSize)
                    }).ToList(),
                    Messages = fullTicket.Messages.Select(m => new TicketMessageItem
                    {
                        Message = m.Message,
                        AuthorRole = m.AuthorRole == "support" ? "Support" : "You",
                        CreatedAt = m.CreatedAt.ToString("MMM d 'at' h:mm tt"),
                        IsSupport = m.AuthorRole == "support",
                        GitHubCommentUrl = m.GitHubCommentUrl
                    }).ToList()
                };
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to load ticket: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SendReplyAsync()
    {
        if (_ticketService == null || SelectedTicket == null) return;

        if (string.IsNullOrWhiteSpace(ReplyMessage))
        {
            StatusMessage = "Please enter a message";
            return;
        }

        IsSubmitting = true;

        try
        {
            var result = await _ticketService.AddReplyAsync(SelectedTicket.Id, ReplyMessage);

            if (result.Success)
            {
                ReplyMessage = "";
                // Refresh ticket to show new message
                await ViewTicketAsync(SelectedTicket);
            }
            else
            {
                StatusMessage = result.Error ?? "Failed to send reply";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to send reply: {ex.Message}";
        }
        finally
        {
            IsSubmitting = false;
        }
    }

    [RelayCommand]
    private async Task CloseTicketAsync()
    {
        if (_ticketService == null || SelectedTicket == null) return;

        IsSubmitting = true;

        try
        {
            var result = await _ticketService.CloseTicketAsync(SelectedTicket.Id);

            if (result.Success)
            {
                StatusMessage = "Ticket closed";
                ShowNewTicketForm = true;
                SelectedTicket = null;
                await LoadTicketsAsync();
            }
            else
            {
                StatusMessage = result.Error ?? "Failed to close ticket";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to close ticket: {ex.Message}";
        }
        finally
        {
            IsSubmitting = false;
        }
    }

    [RelayCommand]
    private void BackToList()
    {
        ShowNewTicketForm = true;
        SelectedTicket = null;
        ReplyMessage = "";
    }

    [RelayCommand]
    private void NewTicket()
    {
        ShowNewTicketForm = true;
        SelectedTicket = null;
        ReplyMessage = "";
    }

    [RelayCommand]
    private static void OpenGitHubIssue(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return;

        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            };
            System.Diagnostics.Process.Start(psi);
        }
        catch
        {
            // Ignore errors opening URL
        }
    }

    private static string FormatStatus(SupportTicketStatus status) => status switch
    {
        SupportTicketStatus.Open => "Open",
        SupportTicketStatus.InProgress => "In Progress",
        SupportTicketStatus.AwaitingReply => "Awaiting Reply",
        SupportTicketStatus.Resolved => "Resolved",
        SupportTicketStatus.Closed => "Closed",
        _ => "Unknown"
    };

    private static string GetStatusColor(SupportTicketStatus status) => status switch
    {
        SupportTicketStatus.Open => "info",
        SupportTicketStatus.InProgress => "warning",
        SupportTicketStatus.AwaitingReply => "success",
        SupportTicketStatus.Resolved => "success",
        SupportTicketStatus.Closed => "muted",
        _ => "muted"
    };

    private static string FormatFileSize(long bytes)
    {
        return bytes switch
        {
            < 1024 => $"{bytes} B",
            < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
            _ => $"{bytes / (1024.0 * 1024.0):F1} MB"
        };
    }

    private static string GetMimeType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".txt" => "text/plain",
            ".log" => "text/plain",
            ".json" => "application/json",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }
}

public sealed class SupportTicketItem
{
    public string Id { get; init; } = "";
    public string Subject { get; init; } = "";
    public string? Body { get; init; }
    public string Status { get; init; } = "";
    public string StatusColor { get; init; } = "muted";
    public string CreatedAt { get; init; } = "";
    public bool HasNewReply { get; init; }
    public string? GitHubIssueUrl { get; init; }
    public int? GitHubIssueNumber { get; init; }
    public List<AttachedFileItem> Attachments { get; init; } = [];
    public List<TicketMessageItem> Messages { get; init; } = [];
}

public sealed class TicketMessageItem
{
    public string Message { get; init; } = "";
    public string AuthorRole { get; init; } = "";
    public string CreatedAt { get; init; } = "";
    public bool IsSupport { get; init; }
    public string? GitHubCommentUrl { get; init; }
}

public sealed class AttachedFileItem
{
    public string FileName { get; init; } = "";
    public string FileSize { get; init; } = "";
    public long FileSizeBytes { get; init; }
    public string MimeType { get; init; } = "";
    public string Base64Data { get; init; } = "";
}
