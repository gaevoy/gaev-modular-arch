# Plan: Group features into named subfolders under `features/`

## Context

The `dotnet/features/` directory currently has 6 flat project folders (`Gaev.X.Contracts` and `Gaev.X.Impl` for User, Currency, Dashboard). The flat layout treats projects as the atomic unit; the goal is to make **features** the atomic unit instead.

Each feature folder becomes the single canonical location for everything that belongs to that feature: code (Contracts + Impl projects), documentation, diagrams, decision records, and any other feature-scoped assets. The folder *is* the feature boundary — ownership is tangible (one folder = one owner), discoverability is straightforward (no guessing where a feature's docs live), and future additions (tests, ADRs, architecture diagrams, CLAUDE.md) have a natural home without a per-file naming decision.

Concretely: create `user/`, `currency/`, `dashboard/` subfolders, move the two projects into each, add a per-feature `README.md` with ownership and purpose, update all references in the solution, `.csproj` files, and the root `README.md` (including links to the new feature READMEs).

Folder naming convention: **lowercase for grouping folders** (matching `features/`, `src/`, etc.), **PascalCase retained for the actual `.csproj` project directories** (matching C# namespace conventions). This is consistent with the existing repo and current Microsoft conventions.

---

## Target structure

```
dotnet/features/
├── user/
│   ├── Gaev.User.Contracts/
│   ├── Gaev.User.Impl/
│   └── README.md
├── currency/
│   ├── Gaev.Currency.Contracts/
│   ├── Gaev.Currency.Impl/
│   └── README.md
└── dashboard/
    ├── Gaev.Dashboard.Contracts/
    ├── Gaev.Dashboard.Impl/
    └── README.md
```

---

## Steps

### 1. Move folders with `git mv`

```bash
cd dotnet/features
mkdir user currency dashboard
git mv Gaev.User.Contracts     user/Gaev.User.Contracts
git mv Gaev.User.Impl          user/Gaev.User.Impl
git mv Gaev.Currency.Contracts currency/Gaev.Currency.Contracts
git mv Gaev.Currency.Impl      currency/Gaev.Currency.Impl
git mv Gaev.Dashboard.Contracts dashboard/Gaev.Dashboard.Contracts
git mv Gaev.Dashboard.Impl      dashboard/Gaev.Dashboard.Impl
```

### 2. Update `Gaev.ModularArch.slnx`

Split the single `/features/` folder into three sub-folders that mirror the disk layout:

```xml
<Solution>
  <Folder Name="/features/currency/">
    <Project Path="features/currency/Gaev.Currency.Contracts/Gaev.Currency.Contracts.csproj" />
    <Project Path="features/currency/Gaev.Currency.Impl/Gaev.Currency.Impl.csproj" />
  </Folder>
  <Folder Name="/features/dashboard/">
    <Project Path="features/dashboard/Gaev.Dashboard.Contracts/Gaev.Dashboard.Contracts.csproj" />
    <Project Path="features/dashboard/Gaev.Dashboard.Impl/Gaev.Dashboard.Impl.csproj" />
  </Folder>
  <Folder Name="/features/user/">
    <Project Path="features/user/Gaev.User.Contracts/Gaev.User.Contracts.csproj" />
    <Project Path="features/user/Gaev.User.Impl/Gaev.User.Impl.csproj" />
  </Folder>
  <Project Path="Gaev.Host/Gaev.Host.csproj" />
</Solution>
```

### 3. Update `Gaev.Host/Gaev.Host.csproj`

Six `<ProjectReference>` paths each gain the lowercase feature segment:

```
..\features\Gaev.User.Contracts\...      → ..\features\user\Gaev.User.Contracts\...
..\features\Gaev.User.Impl\...           → ..\features\user\Gaev.User.Impl\...
..\features\Gaev.Currency.Contracts\...  → ..\features\currency\Gaev.Currency.Contracts\...
..\features\Gaev.Currency.Impl\...       → ..\features\currency\Gaev.Currency.Impl\...
..\features\Gaev.Dashboard.Contracts\... → ..\features\dashboard\Gaev.Dashboard.Contracts\...
..\features\Gaev.Dashboard.Impl\...      → ..\features\dashboard\Gaev.Dashboard.Impl\...
```

### 4. Update `features/dashboard/Gaev.Dashboard.Impl/Gaev.Dashboard.Impl.csproj`

Cross-feature references (Contracts from other features are now two levels up with a lowercase segment):

```
..\Gaev.User.Contracts\...     → ..\..\user\Gaev.User.Contracts\...
..\Gaev.Currency.Contracts\... → ..\..\currency\Gaev.Currency.Contracts\...
..\Gaev.Dashboard.Contracts\...→ ..\Gaev.Dashboard.Contracts\...   (unchanged — same feature folder)
```

`Gaev.User.Impl.csproj` and `Gaev.Currency.Impl.csproj` only reference their own Contracts via `../Gaev.X.Contracts/...` — the relative depth is unchanged, **no edits needed**.

### 5. Create `features/{feature}/README.md` (×3)

Each file covers:
- Feature name and one-paragraph purpose
- **Owner:** TBD
- Key interfaces exported (e.g. `IUserService`)
- Endpoints the feature maps
- Dependencies on other features' contracts

### 6. Update `dotnet/README.md`

Two changes:

**a) Add a "Features" section** (or a table) with links to each README:

```markdown
## Features

| Feature | Description |
|---|---|
| [User](features/user/README.md) | User management — create and look up users |
| [Currency](features/currency/README.md) | Currency conversion |
| [Dashboard](features/dashboard/README.md) | Cross-feature summary (user count + sample conversion) |
```

**b) Update the "How to Add a New Feature" commands** (steps 1, 3, and 5):

```
# step 1
-o features/Gaev.MyFeature.Contracts
→  -o features/myfeature/Gaev.MyFeature.Contracts

# step 3
-o features/Gaev.MyFeature.Impl
→  -o features/myfeature/Gaev.MyFeature.Impl

# step 5
dotnet add features/Gaev.MyFeature.Impl reference features/Gaev.MyFeature.Contracts
→  dotnet add features/myfeature/Gaev.MyFeature.Impl reference features/myfeature/Gaev.MyFeature.Contracts
```

---

## Verification

```bash
cd dotnet
dotnet build Gaev.ModularArch.slnx   # 0 errors
dotnet run --project Gaev.Host        # swagger at http://localhost:5000/swagger
```

Hit all three feature endpoints: `/users`, `/currency/convert?amount=100&from=USD&to=EUR`, `/dashboard`.
