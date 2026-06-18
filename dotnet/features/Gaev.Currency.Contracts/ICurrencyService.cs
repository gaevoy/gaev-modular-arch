namespace Gaev.Currency.Contracts;

public interface ICurrencyService
{
    ConversionResult Convert(decimal amount, string from, string to);
}
