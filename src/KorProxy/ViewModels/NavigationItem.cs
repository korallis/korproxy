using Avalonia.Media;

namespace KorProxy.ViewModels;

/// <summary>
/// Navigation group for organizing sidebar items
/// </summary>
public enum NavigationGroup
{
    General,
    Configuration,
    Diagnostics
}

/// <summary>
/// Represents a navigation item in the sidebar
/// </summary>
public sealed class NavigationItem
{
    public required string Title { get; init; }
    public required string Tag { get; init; }
    public required StreamGeometry Icon { get; init; }
    public NavigationGroup Group { get; init; } = NavigationGroup.General;
    public string? Badge { get; set; }
    public bool HasBadge => !string.IsNullOrEmpty(Badge);
    
    // Common Fluent icons as path data
    public static class Icons
    {
        public static StreamGeometry Dashboard { get; } = StreamGeometry.Parse(
            "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z");
        
        public static StreamGeometry Accounts { get; } = StreamGeometry.Parse(
            "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z");
        
        public static StreamGeometry Settings { get; } = StreamGeometry.Parse(
            "M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94 0 .31.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z");
        
        public static StreamGeometry Logs { get; } = StreamGeometry.Parse(
            "M3 3h18v2H3V3zm0 8h18v2H3v-2zm0 8h18v2H3v-2zm0-4h12v2H3v-2zm0-8h12v2H3V7z");
        
        public static StreamGeometry Models { get; } = StreamGeometry.Parse(
            "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5");
        
        public static StreamGeometry Integrations { get; } = StreamGeometry.Parse(
            "M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z");
    }
}
