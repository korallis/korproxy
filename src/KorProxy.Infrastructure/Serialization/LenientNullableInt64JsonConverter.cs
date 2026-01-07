using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace KorProxy.Infrastructure.Serialization;

/// <summary>
/// Convex can contain non-finite numbers (e.g. NaN) which are not representable in JSON. When serialized over HTTP,
/// these values may come back as strings like "NaN". This converter treats non-finite / unparseable values as null
/// to avoid hard failures for optional timestamp fields.
/// </summary>
public sealed class LenientNullableInt64JsonConverter : JsonConverter<long?>
{
    public override long? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Null:
                return null;

            case JsonTokenType.Number:
                if (reader.TryGetInt64(out var int64))
                    return int64;

                if (reader.TryGetDouble(out var dbl))
                    return ConvertFiniteWholeDoubleToInt64OrNull(dbl);

                return null;

            case JsonTokenType.String:
            {
                var s = reader.GetString();
                if (string.IsNullOrWhiteSpace(s))
                    return null;

                s = s.Trim();

                // Common non-finite encodings
                if (string.Equals(s, "NaN", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(s, "Infinity", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(s, "+Infinity", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(s, "-Infinity", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(s, "null", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedInt64))
                    return parsedInt64;

                if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsedDouble))
                    return ConvertFiniteWholeDoubleToInt64OrNull(parsedDouble);

                return null;
            }

            default:
                return null;
        }
    }

    public override void Write(Utf8JsonWriter writer, long? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteNumberValue(value.Value);
            return;
        }

        writer.WriteNullValue();
    }

    private static long? ConvertFiniteWholeDoubleToInt64OrNull(double value)
    {
        if (!double.IsFinite(value))
            return null;

        // Only accept values that are effectively whole numbers.
        if (Math.Abs(value - Math.Round(value)) > 0)
            return null;

        if (value < long.MinValue || value > long.MaxValue)
            return null;

        return (long)Math.Round(value);
    }
}

