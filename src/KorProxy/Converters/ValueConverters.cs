using System.Globalization;
using Avalonia.Data.Converters;

namespace KorProxy.Converters;

/// <summary>
/// Converts a value by comparing it to the parameter for equality.
/// Returns true if value equals parameter.
/// </summary>
public sealed class IsEqualConverter : IValueConverter
{
    public static readonly IsEqualConverter Instance = new();

    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value == null && parameter == null)
            return true;
            
        if (value == null || parameter == null)
            return false;
            
        // Handle numeric comparisons
        if (value is int intValue && parameter is string paramStr && int.TryParse(paramStr, out var paramInt))
        {
            return intValue == paramInt;
        }
        
        return value.Equals(parameter) || value.ToString() == parameter.ToString();
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Returns true if the numeric value is greater than zero.
/// </summary>
public sealed class GreaterThanZeroConverter : IValueConverter
{
    public static readonly GreaterThanZeroConverter Instance = new();

    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value switch
        {
            int i => i > 0,
            double d => d > 0,
            float f => f > 0,
            decimal m => m > 0,
            long l => l > 0,
            _ => false
        };
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
