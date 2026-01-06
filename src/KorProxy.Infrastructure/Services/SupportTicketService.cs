using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Implementation of support ticket service using Convex backend with GitHub integration.
/// </summary>
public sealed class SupportTicketService : ISupportTicketService
{
    private readonly IConvexApiClient _convexClient;
    private readonly ISessionStore _sessionStore;
    private readonly IProxySupervisor _proxySupervisor;
    private readonly ILogger<SupportTicketService>? _logger;
    
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
    
    public SupportTicketService(
        IConvexApiClient convexClient,
        ISessionStore sessionStore,
        IProxySupervisor proxySupervisor,
        ILogger<SupportTicketService>? logger = null)
    {
        _convexClient = convexClient;
        _sessionStore = sessionStore;
        _proxySupervisor = proxySupervisor;
        _logger = logger;
    }
    
    public async Task<SupportTicketResult> CreateTicketAsync(
        string subject,
        string body,
        bool includeDiagnostics,
        SupportTicketPriority priority = SupportTicketPriority.Normal,
        CancellationToken ct = default)
    {
        return await CreateTicketWithAttachmentsAsync(
            subject, 
            body, 
            includeDiagnostics, 
            [], 
            priority, 
            ct);
    }
    
    public async Task<SupportTicketResult> CreateTicketWithAttachmentsAsync(
        string subject,
        string body,
        bool includeDiagnostics,
        IReadOnlyList<SupportTicketAttachment> attachments,
        SupportTicketPriority priority = SupportTicketPriority.Normal,
        CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return SupportTicketResult.Fail("Not logged in");
            }
            
            var args = new Dictionary<string, object>
            {
                ["token"] = token,
                ["subject"] = subject,
                ["body"] = body,
                ["appVersion"] = GetAppVersion(),
                ["platform"] = GetPlatform(),
                ["os"] = GetOsVersion(),
                ["priority"] = PriorityToString(priority)
            };
            
            if (includeDiagnostics)
            {
                var logs = await GetRecentLogsAsync(ct);
                if (logs.Count > 0)
                {
                    args["logExcerpt"] = logs;
                }
            }
            
            // Add attachments if any
            if (attachments.Count > 0)
            {
                var attachmentList = attachments.Select(a => new Dictionary<string, object>
                {
                    ["fileName"] = a.FileName,
                    ["fileSize"] = a.FileSize,
                    ["mimeType"] = a.MimeType,
                    ["data"] = a.Data
                }).ToList();
                args["attachments"] = attachmentList;
            }
            
            // Use the action that creates both ticket and GitHub issue
            var result = await _convexClient.ActionAsync<CreateTicketWithGitHubResponse>(
                "supportTickets:createTicketWithGitHub", 
                args, 
                ct);
            
            if (result == null)
            {
                return SupportTicketResult.Fail("No response from server");
            }
            
            if (!result.Success)
            {
                return SupportTicketResult.Fail(result.Error ?? "Unknown error");
            }
            
            _logger?.LogInformation("Created support ticket {TicketId} with GitHub issue {GitHubUrl}", 
                result.TicketId, result.GitHubIssueUrl);
            return SupportTicketResult.Ok(result.TicketId, result.GitHubIssueUrl);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to create support ticket");
            return SupportTicketResult.Fail($"Failed to create ticket: {ex.Message}");
        }
    }
    
    public async Task<List<SupportTicket>> GetMyTicketsAsync(CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return [];
            }
            
            var result = await _convexClient.QueryAsync<ListTicketsResponse>(
                "supportTickets:listMyTickets",
                new Dictionary<string, object> { ["token"] = token },
                ct);
            
            if (result?.Tickets == null)
            {
                return [];
            }
            
            return result.Tickets.Select(MapTicket).ToList();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to get tickets");
            return [];
        }
    }
    
    public async Task<SupportTicket?> GetTicketAsync(string ticketId, CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            
            var ticket = await _convexClient.QueryAsync<TicketDto>(
                "supportTickets:getTicket",
                new Dictionary<string, object>
                {
                    ["token"] = token,
                    ["ticketId"] = ticketId
                },
                ct);
            
            if (ticket == null)
            {
                return null;
            }
            
            var result = MapTicket(ticket);
            
            // Get messages
            var messagesResult = await _convexClient.QueryAsync<ListMessagesResponse>(
                "supportTickets:getTicketMessages",
                new Dictionary<string, object>
                {
                    ["token"] = token,
                    ["ticketId"] = ticketId
                },
                ct);
            
            if (messagesResult?.Messages != null)
            {
                result = result with
                {
                    Messages = messagesResult.Messages.Select(m => new SupportTicketMessage
                    {
                        Id = m.Id ?? "",
                        Message = m.Message ?? "",
                        AuthorRole = m.AuthorRole ?? "user",
                        CreatedAt = DateTimeOffset.FromUnixTimeMilliseconds((long)m.CreatedAt),
                        GitHubCommentId = ToNullableInt32(m.GitHubCommentId),
                        GitHubCommentUrl = m.GitHubCommentUrl
                    }).ToList()
                };
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to get ticket {TicketId}", ticketId);
            return null;
        }
    }
    
    public async Task<SupportTicketResult> AddReplyAsync(
        string ticketId, 
        string message,
        CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return SupportTicketResult.Fail("Not logged in");
            }
            
            // Use action so we can also post to GitHub immediately (when linked).
            var result = await _convexClient.ActionAsync<AddMessageWithGitHubResponse>(
                "supportTickets:addMessageWithGitHub",
                new Dictionary<string, object>
                {
                    ["token"] = token,
                    ["ticketId"] = ticketId,
                    ["message"] = message
                },
                ct);
            
            if (result == null)
            {
                return SupportTicketResult.Fail("No response from server");
            }
            
            if (!result.Success)
            {
                return SupportTicketResult.Fail(result.Error ?? "Unknown error");
            }
            
            return SupportTicketResult.Ok();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to add reply to ticket {TicketId}", ticketId);
            return SupportTicketResult.Fail($"Failed to add reply: {ex.Message}");
        }
    }
    
    public async Task<SupportTicketResult> CloseTicketAsync(string ticketId, CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return SupportTicketResult.Fail("Not logged in");
            }
            
            var result = await _convexClient.MutationAsync<BaseResponse>(
                "supportTickets:updateTicketStatus",
                new Dictionary<string, object>
                {
                    ["token"] = token,
                    ["ticketId"] = ticketId,
                    ["status"] = "closed"
                },
                ct);
            
            if (result == null)
            {
                return SupportTicketResult.Fail("No response from server");
            }
            
            if (!result.Success)
            {
                return SupportTicketResult.Fail(result.Error ?? "Unknown error");
            }
            
            return SupportTicketResult.Ok();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to close ticket {TicketId}", ticketId);
            return SupportTicketResult.Fail($"Failed to close ticket: {ex.Message}");
        }
    }
    
    public async Task<SupportTicketSyncResult> SyncTicketsAsync(CancellationToken ct = default)
    {
        try
        {
            var token = await _sessionStore.LoadTokenAsync(ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return SupportTicketSyncResult.Fail("Not logged in");
            }
            
            var result = await _convexClient.ActionAsync<SyncTicketsResponse>(
                "supportTickets:syncAllUserTickets",
                new Dictionary<string, object> { ["token"] = token },
                ct);
            
            if (result == null)
            {
                return SupportTicketSyncResult.Fail("No response from server");
            }
            
            if (!result.Success)
            {
                return SupportTicketSyncResult.Fail(result.Error ?? "Unknown error");
            }
            
            _logger?.LogInformation("Synced {SyncedTickets} tickets, {NewComments} new comments", 
                (int)result.SyncedTickets, (int)result.NewComments);
            return SupportTicketSyncResult.Ok((int)result.SyncedTickets, (int)result.NewComments);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to sync tickets");
            return SupportTicketSyncResult.Fail($"Failed to sync tickets: {ex.Message}");
        }
    }
    
    #region Helpers
    
    private static string GetAppVersion()
    {
        var assembly = System.Reflection.Assembly.GetEntryAssembly();
        var version = assembly?.GetName().Version;
        return version?.ToString() ?? "0.0.0";
    }
    
    private static string GetPlatform()
    {
        if (OperatingSystem.IsWindows()) return "win32";
        if (OperatingSystem.IsMacOS()) return "darwin";
        if (OperatingSystem.IsLinux()) return "linux";
        return "unknown";
    }
    
    private static string GetOsVersion()
    {
        return $"{RuntimeInformation.OSDescription} ({RuntimeInformation.OSArchitecture})";
    }
    
    private static string PriorityToString(SupportTicketPriority priority) => priority switch
    {
        SupportTicketPriority.Low => "low",
        SupportTicketPriority.Normal => "normal",
        SupportTicketPriority.High => "high",
        SupportTicketPriority.Urgent => "urgent",
        _ => "normal"
    };
    
    private static SupportTicketStatus ParseStatus(string? status) => status switch
    {
        "open" => SupportTicketStatus.Open,
        "in_progress" => SupportTicketStatus.InProgress,
        "awaiting_reply" => SupportTicketStatus.AwaitingReply,
        "resolved" => SupportTicketStatus.Resolved,
        "closed" => SupportTicketStatus.Closed,
        _ => SupportTicketStatus.Open
    };
    
    private static SupportTicketPriority ParsePriority(string? priority) => priority switch
    {
        "low" => SupportTicketPriority.Low,
        "normal" => SupportTicketPriority.Normal,
        "high" => SupportTicketPriority.High,
        "urgent" => SupportTicketPriority.Urgent,
        _ => SupportTicketPriority.Normal
    };
    
    private static SupportTicket MapTicket(TicketDto dto) => new()
    {
        Id = dto.Id ?? "",
        Subject = dto.Subject ?? "",
        Body = dto.Body ?? "",
        Status = ParseStatus(dto.Status),
        Priority = ParsePriority(dto.Priority),
        CreatedAt = DateTimeOffset.FromUnixTimeMilliseconds((long)dto.CreatedAt),
        UpdatedAt = dto.UpdatedAt.HasValue 
            ? DateTimeOffset.FromUnixTimeMilliseconds((long)dto.UpdatedAt.Value) 
            : null,
        LastResponseAt = dto.LastResponseAt.HasValue 
            ? DateTimeOffset.FromUnixTimeMilliseconds((long)dto.LastResponseAt.Value) 
            : null,
        LastResponseBy = dto.LastResponseBy,
        GitHubIssueNumber = ToNullableInt32(dto.GitHubIssueNumber),
        GitHubIssueUrl = dto.GitHubIssueUrl,
        LastSyncedAt = dto.LastSyncedAt.HasValue
            ? DateTimeOffset.FromUnixTimeMilliseconds((long)dto.LastSyncedAt.Value)
            : null,
        Attachments = dto.Attachments?.Select(a => new SupportTicketAttachment
        {
            FileName = a.FileName ?? "",
            FileSize = (long)a.FileSize,
            MimeType = a.MimeType ?? "",
            Data = a.Data ?? ""
        }).ToList() ?? []
    };
    
    private static int? ToNullableInt32(double? value)
    {
        if (!value.HasValue)
            return null;

        // Convex/GitHub numbers can come back as 1.0; truncate safely.
        var truncated = Math.Truncate(value.Value);
        if (truncated < int.MinValue || truncated > int.MaxValue)
            return null;

        return (int)truncated;
    }

    private static long? ToNullableInt64(double? value)
    {
        if (!value.HasValue)
            return null;

        var truncated = Math.Truncate(value.Value);
        if (truncated < long.MinValue || truncated > long.MaxValue)
            return null;

        return (long)truncated;
    }

    private Task<List<object>> GetRecentLogsAsync(CancellationToken ct)
    {
        try
        {
            var logs = _proxySupervisor.GetRecentLogs();
            var result = logs
                .Where(l => l.Contains("ERROR", StringComparison.OrdinalIgnoreCase) || 
                           l.Contains("WARN", StringComparison.OrdinalIgnoreCase))
                .TakeLast(20)
                .Select(l => (object)new
                {
                    level = l.Contains("ERROR", StringComparison.OrdinalIgnoreCase) ? "ERROR" : "WARN",
                    message = l.Length > 500 ? l[..500] + "..." : l,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                })
                .ToList();
                
            return Task.FromResult(result);
        }
        catch
        {
            return Task.FromResult<List<object>>([]);
        }
    }
    
    #endregion
    
    #region DTOs
    
    private class BaseResponse
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
    }
    
    private sealed class CreateTicketResponse : BaseResponse
    {
        public string? TicketId { get; set; }
    }
    
    private sealed class CreateTicketWithGitHubResponse : BaseResponse
    {
        public string? TicketId { get; set; }
        public string? GitHubIssueUrl { get; set; }
    }
    
    private sealed class AddMessageResponse : BaseResponse
    {
        public string? MessageId { get; set; }
    }

    private sealed class AddMessageWithGitHubResponse : BaseResponse
    {
        public string? MessageId { get; set; }
        public string? GitHubCommentUrl { get; set; }
    }
    
    private sealed class SyncTicketsResponse : BaseResponse
    {
        // JavaScript numbers are doubles, not ints
        public double SyncedTickets { get; set; }
        public double NewComments { get; set; }
    }
    
    private sealed class ListTicketsResponse
    {
        public List<TicketDto>? Tickets { get; set; }
    }
    
    private sealed class ListMessagesResponse
    {
        public List<MessageDto>? Messages { get; set; }
    }
    
    private sealed class TicketDto
    {
        [JsonPropertyName("_id")]
        public string? Id { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        // Convex returns JavaScript numbers (doubles); deserialize as double and cast.
        public double CreatedAt { get; set; }
        public double? UpdatedAt { get; set; }
        public double? LastResponseAt { get; set; }
        public string? LastResponseBy { get; set; }
        // JS number (may be serialized like 1.0)
        public double? GitHubIssueNumber { get; set; }
        public string? GitHubIssueUrl { get; set; }
        public double? LastSyncedAt { get; set; }
        public List<AttachmentDto>? Attachments { get; set; }
    }
    
    private sealed class AttachmentDto
    {
        public string? FileName { get; set; }
        public double FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Data { get; set; }
    }
    
    private sealed class MessageDto
    {
        [JsonPropertyName("_id")]
        public string? Id { get; set; }
        public string? Message { get; set; }
        public string? AuthorRole { get; set; }
        // Convex returns JavaScript numbers (doubles); deserialize as double and cast.
        public double CreatedAt { get; set; }
        // GitHub comment IDs can exceed Int32; deserialize as double and cast.
        public double? GitHubCommentId { get; set; }
        public string? GitHubCommentUrl { get; set; }
    }
    
    #endregion
}
