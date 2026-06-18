# Plan: .NET 10 Modular Architecture Demo

## Context

Mirror the React modular architecture (DIP + IoC + contract/impl split) in C# .NET 10. The React version separates features into `*-contract` and `*-impl` npm packages, wires them through an inversify IoC container, and never lets the host import implementations directly. The .NET version does the same with class library projects and `Microsoft.Extensions.DependencyInjection` (built-in IoC). Minimal APIs expose each feature's endpoints. Swagger UI is included for exploration.

Same 3 features as React: **User**, **Currency**, **Dashboard**.

---

## Directory Structure

```
dotnet/
├── Gaev.ModularArch.slnx
├── README.md
├── Gaev.Host/                    ← ASP.NET Core entry point (Program.cs + Swagger)
└── features/
    ├── Gaev.User.Contracts/      ← IUserService, IUser DTO — zero impl deps
    ├── Gaev.User.Impl/           ← UserService + AddUserFeature() extension
    ├── Gaev.Currency.Contracts/
    ├── Gaev.Currency.Impl/
    ├── Gaev.Dashboard.Contracts/
    └── Gaev.Dashboard.Impl/      ← depends on User + Currency contracts only
```

**Rules mirroring React:**
- Contract projects: zero dependencies on impl projects, only BCL types + own DTOs
- Impl projects: reference own contract + any other *contract* projects, never other *impl* projects
- Host (`Gaev.Host`): references all *contract* projects + calls `services.AddXxxFeature()` from impl projects

---

## The .NET Equivalent of `registerBundle` / `resolveAsync`

Each impl project exposes **one** `IServiceCollection` extension method:

```csharp
// Gaev.User.Impl/ServiceCollectionExtensions.cs
public static IServiceCollection AddUserFeature(this IServiceCollection services)
{
    services.AddSingleton<IUserService, UserService>();
    return services;
}
```

`Program.cs` in Host calls all of them:
```csharp
builder.Services
    .AddUserFeature()
    .AddCurrencyFeature()
    .AddDashboardFeature();
```

This is the DIP enforcement point: Host wires the container once at startup; nothing else references impl types.

---

## 3 Features

### User
- `IUserService` with `GetUser(Guid id)`, `ListUsers()`, `CreateUser(CreateUserRequest)`
- In-memory `Dictionary<Guid, User>` implementation
- Endpoints: `GET /users`, `GET /users/{id}`, `POST /users`

### Currency
- `ICurrencyService` with `Convert(decimal amount, string from, string to) → ConversionResult`
- Hard-coded rate table (mock — no external HTTP call)
- Endpoint: `GET /currency/convert?amount=100&from=USD&to=EUR`

### Dashboard
- `IDashboardService` injects `IUserService` + `ICurrencyService` via constructor (standard DI)
- Returns a composite DTO: a user summary + a sample USD→EUR conversion
- Demonstrates cross-feature injection: Dashboard impl references only *contract* projects
- Endpoint: `GET /dashboard`

---

## Project Reference Graph

```
Gaev.Host
  ├── Gaev.User.Contracts
  ├── Gaev.Currency.Contracts
  ├── Gaev.Dashboard.Contracts
  ├── Gaev.User.Impl          → Gaev.User.Contracts
  ├── Gaev.Currency.Impl      → Gaev.Currency.Contracts
  └── Gaev.Dashboard.Impl     → Gaev.Dashboard.Contracts
                                + Gaev.User.Contracts
                                + Gaev.Currency.Contracts
```

*Host references impl projects only to call `AddXxxFeature()`. It never touches their concrete types.*

---

## Tech Stack

- .NET 10 SDK
- ASP.NET Core Minimal APIs
- `Microsoft.Extensions.DependencyInjection` (built-in IoC — no third-party container)
- `Swashbuckle.AspNetCore` for Swagger UI

No third-party IoC or utility packages — only Swashbuckle for Swagger UI.

---

## Implementation Order

1. `dotnet/Gaev.ModularArch.slnx` + all 7 projects scaffolded (`dotnet new`) under `features/`
2. Contract projects (pure interfaces + DTOs, no logic)
3. `Gaev.User.Impl` + `Gaev.Currency.Impl` (independent)
4. `Gaev.Dashboard.Impl` (depends on User + Currency contracts)
5. `Gaev.Host` — wire Swagger, call `AddXxxFeature()`, map endpoints
6. `README.md`

---

## README Contents (dotnet/README.md)

- Overview and motivation (DIP at the assembly level)
- Project types: contracts / impl / host (with rules for each)
- Dependency graph diagram
- The `AddXxxFeature()` convention and how it parallels `registerBundle`
- Cross-feature injection (Dashboard impl, constructor DI through contracts)
- How to add a new feature (checklist)
- Getting started (`dotnet run` from Gaev.Host)

---

## Verification

```bash
cd dotnet/Gaev.Host
dotnet run
# open http://localhost:5000/swagger
# GET /users → []
# POST /users {"name":"Alice","email":"alice@example.com"} → 201 with id
# GET /users/{id} → Alice
# GET /currency/convert?amount=100&from=USD&to=EUR → conversion result
# GET /dashboard → combined user + currency payload
dotnet build  # zero warnings, no impl-to-impl project references
```
