using System.Globalization;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace KorProxy.Converters;

public static class BoolConverters
{
    public static readonly IValueConverter Not = new BooleanNotConverter();

    private sealed class BooleanNotConverter : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is bool flag)
                return !flag;
            return true;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is bool flag)
                return !flag;
            return false;
        }
    }
}

/// <summary>
/// Converts a boolean to a Color (green for true, gray for false)
/// </summary>
public sealed class BoolToColorConverter : IValueConverter
{
    public static readonly BoolToColorConverter Instance = new();

    private static readonly Color SuccessColor = Color.Parse("#10B981");
    private static readonly Color MutedColor = Color.Parse("#52525B");

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is true ? SuccessColor : MutedColor;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
