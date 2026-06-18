# Modular Architecture Demo

The same architectural idea — **Dependency Inversion Principle enforced at the module boundary** — implemented twice, in two ecosystems, so you can compare how each one expresses the pattern.

| | React | .NET |
|---|---|---|
| Language | TypeScript | C# 13 |
| Runtime | Browser (Vite + ESM) | ASP.NET Core 10 |
| IoC container | inversify | `Microsoft.Extensions.DependencyInjection` |
| Module unit | npm package (workspace) | class library project |
| Contract boundary | `*-contract` package | `*.Contracts` project |
| Implementation unit | `*-impl` package | `*.Impl` project |
| Registration point | `bootstrap.ts` → `registerBundle()` | `Program.cs` → `AddXxxFeature()` |
| Endpoint/UI wiring | `App.tsx` routes + `React.lazy` | `Program.cs` → `UseXxxFeature()` |

---

## The Core Idea

A feature is split into two parts:

- **Contract** — the interface and data types only. No logic, no dependencies on other features.
- **Impl** — the concrete service that fulfils the contract. It may depend on other features' *contracts*, never on their *impls*.

A single host (the React app or the ASP.NET Core host) is the only place that knows about implementations. It wires the container once at startup and never touches concrete types again after that. Everything else talks through interfaces.

This means you can swap, stub, or extract any feature without touching other features' source code.

---

## The Three Features

Both versions implement the same three features:

- **User** — in-memory store, CRUD operations
- **Currency** — hard-coded rate table, single conversion operation
- **Dashboard** — depends on User + Currency *contracts* only; demonstrates cross-feature injection without impl-to-impl coupling

---

## Repo Layout

```
react/      React + Vite + inversify implementation
dotnet/     ASP.NET Core 10 + Minimal APIs implementation
```

See each folder's README for setup instructions, dependency graphs, and how to add a new feature.

- [react/README.md](react/README.md)
- [dotnet/README.md](dotnet/README.md)
