# Dashboard Feature

Provides a cross-feature summary combining user count and a sample currency conversion. Demonstrates how an impl project can depend on other features' contracts without importing their implementations.

**Owner:** TBD

## Key Interfaces

| Interface | Exported from |
|---|---|
| `IDashboardService` | `Gaev.Dashboard.Contracts` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Cross-feature summary (user count + sample conversion) |

## Dependencies

| Feature | Contract used |
|---|---|
| [User](../user/README.md) | `IUserService` |
| [Currency](../currency/README.md) | `ICurrencyService` |
