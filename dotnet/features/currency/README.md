# Currency Feature

Performs currency conversion between supported currency codes using fixed exchange rates.

**Owner:** John Doe

## Key Interfaces

| Interface | Exported from |
|---|---|
| `ICurrencyService` | `Gaev.Currency.Contracts` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/currency/convert?amount=100&from=USD&to=EUR` | Convert an amount between currencies |

## Dependencies

None — this feature has no cross-feature contract dependencies.
