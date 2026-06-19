using Gaev.Currency.Contracts;

namespace Gaev.Currency.Impl;

internal sealed class CurrencyService : ICurrencyService
{
    private static readonly Dictionary<(string, string), decimal> Rates = new()
    {
        { ("USD", "EUR"), 0.92m },
        { ("EUR", "USD"), 1.09m },
        { ("USD", "GBP"), 0.79m },
        { ("GBP", "USD"), 1.27m },
        { ("EUR", "GBP"), 0.86m },
        { ("GBP", "EUR"), 1.16m },
    };

    public ConversionResult Convert(decimal amount, string from, string to)
    {
        if (from.Equals(to, StringComparison.OrdinalIgnoreCase))
            return new ConversionResult(amount, from, to, amount, 1m);

        var key = (from.ToUpperInvariant(), to.ToUpperInvariant());
        if (!Rates.TryGetValue(key, out var rate))
            throw new InvalidOperationException($"No rate for {from}->{to}");

        return new ConversionResult(amount, from, to, Math.Round(amount * rate, 2), rate);
    }
}
