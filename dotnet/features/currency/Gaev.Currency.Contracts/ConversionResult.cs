namespace Gaev.Currency.Contracts;

public record ConversionResult(decimal Amount, string From, string To, decimal Result, decimal Rate);
