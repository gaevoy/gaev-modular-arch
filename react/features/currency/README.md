# Currency Feature

Provides currency conversion — a user-facing input component, a conversion hook, and an underlying service, all exposed through the IoC container.

**Owner:** John Doe

## Packages

| Package | npm name |
|---|---|
| `currency-contract/` | `@gaev/currency-contract` |
| `currency-impl/` | `@gaev/currency-impl` |

## Key contracts exported

| Export | Kind | Description |
|---|---|---|
| `IConversionResult` | interface | `{ amount: number; from: string; to: string; converted: number }` |
| `ICurrencyService` | interface | `convert(amount, from, to): Promise<IConversionResult>` |
| `UseConversion` | hook type | `() => { convert, result, loading }` |
| `CurrencyInputProps` | props interface | Props for the currency input component |
| `CURRENCY_SERVICE` | symbol | IoC binding key for `ICurrencyService` |
| `CURRENCY_INPUT` | symbol | IoC binding key for the `CurrencyInput` component |
| `USE_CONVERSION` | symbol | IoC binding key for the `useConversion` hook |
| `CURRENCY_PAGE` | symbol | IoC binding key for the `CurrencyPage` component |
| `CURRENCY_SYMBOLS` | symbol[] | All symbols for `registerBundle` |

## Cross-feature dependencies

None. Currency is a leaf feature — no other feature packages are imported.
