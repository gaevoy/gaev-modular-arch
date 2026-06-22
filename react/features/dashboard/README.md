# Dashboard Feature

Provides a cross-feature summary page that composes the User and Currency features — displaying the current user and a currency conversion widget side by side. Demonstrates top-level `await` bundle loading and cross-feature hook injection.

**Owner:** TBD

## Packages

| Package | npm name |
|---|---|
| `dashboard-contract/` | `@gaev/dashboard-contract` |
| `dashboard-impl/` | `@gaev/dashboard-impl` |

## Key contracts exported

| Export | Kind | Description |
|---|---|---|
| `IDashboardService` | interface | Aggregation service for dashboard data |
| `UseDashboard` | hook type | `() => { ... }` combined dashboard state |
| `DashboardWidgetProps` | props interface | Props for the embedded dashboard widget |
| `DASHBOARD_SERVICE` | symbol | IoC binding key for `IDashboardService` |
| `DASHBOARD_WIDGET` | symbol | IoC binding key for the `DashboardWidget` component |
| `USE_DASHBOARD` | symbol | IoC binding key for the `useDashboard` hook |
| `DASHBOARD_PAGE` | symbol | IoC binding key for the `DashboardPage` component |
| `DASHBOARD_SYMBOLS` | symbol[] | All symbols for `registerBundle` |

## Cross-feature dependencies

`dashboard-impl` resolves `IUserService`, `UseCurrentUser`, `UserAvatar`, and `ICurrencyService` from the container at bundle init time via top-level `await`. The contracts are imported statically (`@gaev/user-contract`, `@gaev/currency-contract`); the implementations are loaded lazily through `resolveAsync` — no direct import of `@gaev/user-impl` or `@gaev/currency-impl`.
