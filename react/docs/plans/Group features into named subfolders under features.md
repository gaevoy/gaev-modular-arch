# Plan: Group features into named subfolders under `features/`

## Context

The `react/features/` directory currently has 6 flat package folders (`*-contract` and `*-impl` for user, currency, dashboard). The goal is exactly the same as for the dotnet project: make **features** the atomic unit instead of packages. Each feature subfolder becomes the canonical location for everything belonging to that feature — contracts, implementation, docs, and any future assets (ADRs, diagrams, CLAUDE.md). Discoverability is straightforward and ownership is tangible.

Concretely: create `user/`, `currency/`, `dashboard/` subfolders, move the two packages into each, add a per-feature `README.md`, and update all file references that encode the old flat paths.

Folder naming convention: **lowercase for grouping folders** (matching dotnet's `user/`, `currency/`, `dashboard/` and already matching the React package suffixes).

---

## Target Structure

```
react/features/
├── user/
│   ├── user-contract/
│   ├── user-impl/
│   └── README.md
├── currency/
│   ├── currency-contract/
│   ├── currency-impl/
│   └── README.md
└── dashboard/
    ├── dashboard-contract/
    ├── dashboard-impl/
    └── README.md
```

---

## Steps

### 1. Move folders with `git mv`

```bash
cd react/features
mkdir user currency dashboard
git mv user-contract      user/user-contract
git mv user-impl          user/user-impl
git mv currency-contract  currency/currency-contract
git mv currency-impl      currency/currency-impl
git mv dashboard-contract dashboard/dashboard-contract
git mv dashboard-impl     dashboard/dashboard-impl
```

### 2. Update root `package.json` — workspaces glob

`react/package.json` currently has `"features/*"`. Change to `"features/*/*"`:

```json
"workspaces": ["container", "features/*/*", "app"]
```

### 3. Update `eslint.config.js` — four glob patterns

`react/eslint.config.js` (lines 3–7). Add one extra wildcard segment:

```
features/*-contract/src/**/*.ts       → features/*/*-contract/src/**/*.ts
features/*-impl/src/**/*.{ts,tsx}     → features/*/*-impl/src/**/*.{ts,tsx}
features/*-impl/src/index.ts          → features/*/*-impl/src/index.ts
features/*-impl/src/register.ts       → features/*/*-impl/src/register.ts
```

### 4. Update `app/vite.config.ts` — six resolve aliases

Each alias path gains the lowercase feature segment:

```
../features/user-contract/src/index.ts      → ../features/user/user-contract/src/index.ts
../features/user-impl/src/index.ts          → ../features/user/user-impl/src/index.ts
../features/currency-contract/src/index.ts  → ../features/currency/currency-contract/src/index.ts
../features/currency-impl/src/index.ts      → ../features/currency/currency-impl/src/index.ts
../features/dashboard-contract/src/index.ts → ../features/dashboard/dashboard-contract/src/index.ts
../features/dashboard-impl/src/index.ts     → ../features/dashboard/dashboard-impl/src/index.ts
```

### 5. Update `tsconfig.json` in all 6 feature packages

Every package currently has `"extends": "../../tsconfig.base.json"`. After moving one level deeper, change to `"../../../tsconfig.base.json"` in all six files:

- `features/user/user-contract/tsconfig.json`
- `features/user/user-impl/tsconfig.json`
- `features/currency/currency-contract/tsconfig.json`
- `features/currency/currency-impl/tsconfig.json`
- `features/dashboard/dashboard-contract/tsconfig.json`
- `features/dashboard/dashboard-impl/tsconfig.json`

### 6. Recreate workspace symlinks

```bash
cd react
npm install
```

### 7. Create `features/{feature}/README.md` (×3)

Each file covers:
- Feature name and one-paragraph purpose
- **Owner:** TBD
- Key contracts exported (interfaces, symbols, hook types, component props)
- Cross-feature dependencies (dashboard only)

### 8. Update `react/README.md`

**a) Add a "Features" section** before "How to Add a New Feature". It should open with a short rationale paragraph explaining why features are grouped into named subfolders — something like:

> Each feature lives in its own subfolder under `features/`. The subfolder is the feature boundary: it holds the contract package, the impl package, a README, and any future assets (ADRs, diagrams, CLAUDE.md). This makes ownership tangible (one folder = one owner), discoverability straightforward (no guessing where a feature's docs live), and leaves future additions with a natural home.

Then a table linking to each per-feature README:

```markdown
## Features

Each feature is a named subfolder under `features/` that contains its contract package, impl package, and README. The subfolder is the ownership and discoverability unit — everything belonging to a feature lives there.

| Feature | Description |
|---|---|
| [User](features/user/README.md) | User identity — current user lookup, avatar display |
| [Currency](features/currency/README.md) | Currency conversion input and service |
| [Dashboard](features/dashboard/README.md) | Cross-feature summary (user + currency) |
```

**b) Update "How to Add a New Feature"** — steps 1 and 2 reference `features/my-feature-contract/` and `features/my-feature-impl/`; update to `features/my-feature/my-feature-contract/` and `features/my-feature/my-feature-impl/`.

---

## Verification

```bash
cd react
npm run typecheck   # tsc --build across all packages — 0 errors
npm run lint        # ESLint architectural rules — 0 violations
npm run build       # Rollup/Vite production build — all 7 chunks emitted
npm run dev         # dev server at http://localhost:5173
```

Navigate to `/#/user`, `/#/currency`, `/#/dashboard`. Each page should load its impl chunk on first visit. Hard-refresh on any route should work correctly.
