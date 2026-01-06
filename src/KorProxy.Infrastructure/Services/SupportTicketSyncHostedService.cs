using KorProxy.Core.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Background service that periodically syncs support tickets with GitHub
/// to fetch new responses from the support team.
/// </summary>
public sealed class SupportTicketSyncHostedService : BackgroundService
{
    private readonly ISupportTicketService _ticketService;
    private readonly ISessionStore _sessionStore;
    private readonly ILogger<SupportTicketSyncHostedService> _logger;
    
    /// <summary>
    /// Sync interval - runs every 30 minutes.
    /// </summary>
    private static readonly TimeSpan SyncInterval = TimeSpan.FromMinutes(30);
    
    /// <summary>
    /// Initial delay before first sync to allow app to fully start.
    /// </summary>
    private static readonly TimeSpan InitialDelay = TimeSpan.FromMinutes(2);

    public SupportTicketSyncHostedService(
        ISupportTicketService ticketService,
        ISessionStore sessionStore,
        ILogger<SupportTicketSyncHostedService> logger)
    {
        _ticketService = ticketService;
        _sessionStore = sessionStore;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Support ticket sync service starting");

        // Wait for initial delay to let the app fully start
        try
        {
            await Task.Delay(InitialDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncTicketsIfLoggedInAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Expected when shutting down
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during support ticket sync");
            }

            try
            {
                await Task.Delay(SyncInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Support ticket sync service stopped");
    }

    private async Task SyncTicketsIfLoggedInAsync(CancellationToken ct)
    {
        // Check if user is logged in
        var token = await _sessionStore.LoadTokenAsync(ct);
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogDebug("Skipping ticket sync - user not logged in");
            return;
        }

        _logger.LogDebug("Starting scheduled ticket sync");

        var result = await _ticketService.SyncTicketsAsync(ct);

        if (result.Success)
        {
            if (result.NewComments > 0)
            {
                _logger.LogInformation(
                    "Ticket sync completed: {SyncedTickets} tickets synced, {NewComments} new comments",
                    result.SyncedTickets,
                    result.NewComments);
            }
            else
            {
                _logger.LogDebug("Ticket sync completed: no new comments");
            }
        }
        else
        {
            _logger.LogWarning("Ticket sync failed: {Error}", result.Error);
        }
    }
}
