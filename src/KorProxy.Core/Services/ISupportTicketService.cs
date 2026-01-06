using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

/// <summary>
/// Service for creating and managing customer support tickets.
/// </summary>
public interface ISupportTicketService
{
    /// <summary>
    /// Creates a new support ticket.
    /// </summary>
    Task<SupportTicketResult> CreateTicketAsync(
        string subject,
        string body,
        bool includeDiagnostics,
        SupportTicketPriority priority = SupportTicketPriority.Normal,
        CancellationToken ct = default);
    
    /// <summary>
    /// Creates a new support ticket with attachments and GitHub integration.
    /// </summary>
    Task<SupportTicketResult> CreateTicketWithAttachmentsAsync(
        string subject,
        string body,
        bool includeDiagnostics,
        IReadOnlyList<SupportTicketAttachment> attachments,
        SupportTicketPriority priority = SupportTicketPriority.Normal,
        CancellationToken ct = default);
    
    /// <summary>
    /// Gets all tickets for the current user.
    /// </summary>
    Task<List<SupportTicket>> GetMyTicketsAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Gets a specific ticket by ID.
    /// </summary>
    Task<SupportTicket?> GetTicketAsync(string ticketId, CancellationToken ct = default);
    
    /// <summary>
    /// Adds a reply message to an existing ticket.
    /// </summary>
    Task<SupportTicketResult> AddReplyAsync(
        string ticketId, 
        string message,
        CancellationToken ct = default);
    
    /// <summary>
    /// Closes a ticket.
    /// </summary>
    Task<SupportTicketResult> CloseTicketAsync(string ticketId, CancellationToken ct = default);
    
    /// <summary>
    /// Syncs all user tickets with GitHub to get new comments/responses.
    /// </summary>
    Task<SupportTicketSyncResult> SyncTicketsAsync(CancellationToken ct = default);
}

/// <summary>
/// Result from a support ticket operation.
/// </summary>
public sealed class SupportTicketResult
{
    public bool Success { get; init; }
    public string? TicketId { get; init; }
    public string? GitHubIssueUrl { get; init; }
    public string? Error { get; init; }
    
    public static SupportTicketResult Ok(string? ticketId = null, string? githubIssueUrl = null) 
        => new() { Success = true, TicketId = ticketId, GitHubIssueUrl = githubIssueUrl };
    public static SupportTicketResult Fail(string error) => new() { Success = false, Error = error };
}

/// <summary>
/// Result from syncing support tickets.
/// </summary>
public sealed class SupportTicketSyncResult
{
    public bool Success { get; init; }
    public int SyncedTickets { get; init; }
    public int NewComments { get; init; }
    public string? Error { get; init; }
    
    public static SupportTicketSyncResult Ok(int syncedTickets, int newComments) 
        => new() { Success = true, SyncedTickets = syncedTickets, NewComments = newComments };
    public static SupportTicketSyncResult Fail(string error) 
        => new() { Success = false, Error = error };
}

/// <summary>
/// Represents a support ticket.
/// </summary>
public sealed record SupportTicket
{
    public required string Id { get; init; }
    public required string Subject { get; init; }
    public required string Body { get; init; }
    public required SupportTicketStatus Status { get; init; }
    public required SupportTicketPriority Priority { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public DateTimeOffset? LastResponseAt { get; init; }
    public string? LastResponseBy { get; init; }
    public int? GitHubIssueNumber { get; init; }
    public string? GitHubIssueUrl { get; init; }
    public DateTimeOffset? LastSyncedAt { get; init; }
    public List<SupportTicketAttachment> Attachments { get; init; } = [];
    public List<SupportTicketMessage> Messages { get; init; } = [];
}

/// <summary>
/// A file attachment for a support ticket.
/// </summary>
public sealed class SupportTicketAttachment
{
    public required string FileName { get; init; }
    public required long FileSize { get; init; }
    public required string MimeType { get; init; }
    public required string Data { get; init; } // Base64 encoded
}

/// <summary>
/// A message in a support ticket conversation.
/// </summary>
public sealed class SupportTicketMessage
{
    public required string Id { get; init; }
    public required string Message { get; init; }
    public required string AuthorRole { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public int? GitHubCommentId { get; init; }
    public string? GitHubCommentUrl { get; init; }
}

/// <summary>
/// Support ticket status.
/// </summary>
public enum SupportTicketStatus
{
    Open,
    InProgress,
    AwaitingReply,
    Resolved,
    Closed
}

/// <summary>
/// Support ticket priority.
/// </summary>
public enum SupportTicketPriority
{
    Low,
    Normal,
    High,
    Urgent
}
