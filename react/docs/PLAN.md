# Modular Architecture Demo — React + npm Workspaces + Vite + inversify

## Context

Working demo of modular React architecture driven by the Dependency Inversion Principle. Features are isolated npm packages exposing typed contracts only; implementations are lazy-loaded Vite chunks registered with an IoC container at runtime.

---

## Directory Tree

```
react/
├── package.json
├── tsconfig.base.json
├── README.md
├── container/                            # @gaev/container
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── features/
│   ├── user-contract/                    # @gaev/user-contract
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── IUser.ts
│   │       ├── IUserService.ts           # abstract class + USER_SERVICE symbol
│   │       ├── UserAvatarProps.ts        # props interface + USER_AVATAR symbol
│   │       ├── UseCurrentUser.ts         # hook type + USE_CURRENT_USER symbol
│   │       ├── symbols.ts                # aggregates all symbols → USER_SYMBOLS array
│   │       └── index.ts
│   ├── user-impl/                        # @gaev/user-impl
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── UserService.ts
│   │       ├── UserAvatar.tsx
│   │       ├── useCurrentUser.ts
│   │       ├── register.ts               # all container.bind() calls
│   │       └── index.ts                  # import './register'  ← package entry point
│   ├── currency-contract/                # @gaev/currency-contract
│   │   └── src/
│   │       ├── IConversionResult.ts      # result data interface
│   │       ├── ICurrencyService.ts       # abstract class + CURRENCY_SERVICE symbol
│   │       ├── CurrencyInputProps.ts     # props interface + CURRENCY_INPUT symbol
│   │       ├── UseConversion.ts          # hook type + USE_CONVERSION symbol
│   │       ├── symbols.ts                # → CURRENCY_SYMBOLS array
│   │       └── index.ts
│   ├── currency-impl/                    # @gaev/currency-impl
│   │   └── src/
│   │       ├── CurrencyService.ts
│   │       ├── CurrencyInput.tsx
│   │       ├── useConversion.ts
│   │       ├── register.ts
│   │       └── index.ts
│   ├── dashboard-contract/               # @gaev/dashboard-contract
│   │   └── src/
│   │       ├── IDashboardService.ts
│   │       ├── DashboardWidgetProps.ts
│   │       ├── UseDashboard.ts
│   │       ├── symbols.ts                # → DASHBOARD_SYMBOLS array
│   │       └── index.ts
│   └── dashboard-impl/                   # @gaev/dashboard-impl
│       └── src/
│           ├── DashboardService.ts
│           ├── DashboardWidget.tsx
│           ├── useDashboard.ts
│           ├── register.ts
│           └── index.ts
└── app/                                  # @gaev/app
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── bootstrap.ts
        ├── App.tsx
        └── pages/
            ├── UserPage.tsx
            ├── CurrencyPage.tsx
            └── DashboardPage.tsx
```

---

## npm Scoped Packages (`@gaev/`)

`@scope/package-name` is a built-in npm feature — no extra tooling needed. Groups related monorepo packages, prevents name collisions with public registry packages.

---

## Dependency Graph

```
@gaev/container              (no @gaev/* deps)
       ↑
       ├── @gaev/user-impl          → @gaev/user-contract
       ├── @gaev/currency-impl      → @gaev/currency-contract
       └── @gaev/dashboard-impl     → @gaev/dashboard-contract
                                       + @gaev/user-contract     (symbols + types)
                                       + @gaev/currency-contract (symbols + types)

@gaev/app → @gaev/container + all 3 contracts
            never imports impl packages statically
            (dynamic import only, inside bootstrap.ts)

Contract packages: ZERO @gaev/* deps, ZERO React imports of any kind
```

---

## 3 Features

| Feature | Independent? | What the page shows |
|---|---|---|
| **User** | Yes | Avatar component + user name fetched from IUserService |
| **Currency** | Yes | CurrencyInput component + live conversion from ICurrencyService |
| **Dashboard** | No | Calls `UseCurrentUser` hook (cross-feature hook injection) + renders `DashboardWidget` (which injects `UserAvatar` component + services cross-feature) |

---

## Key Decisions

### Why `index.ts` in impl packages
npm package convention requires a clear entry point referenced by the `exports` field. `index.ts` is that entry — its sole content is `import './register'`. It is the file Vite resolves when bootstrap.ts does `() => import('@gaev/user-impl')`. `register.ts` stays separately named for clarity.

### inversify — manual bindings only, no decorators
`toDynamicValue` / `toConstantValue`. Avoids the Vite/esbuild decorator transform issue; makes registrations explicit and readable.

### Why `reflect-metadata` is needed
inversify's `Container` class depends on the `Reflect` API internally (standardised by the `reflect-metadata` TC39 proposal). Even without `@injectable`/`@inject` decorators, inversify accesses `Reflect.metadata` at module load time and will throw if the polyfill is absent. Import once as the very first line of `main.tsx`.

### No React in contract packages — zero imports
Contracts expose only **props interfaces** (plain TypeScript) and IoC symbols. No `react` in `dependencies`, `devDependencies`, or source files. Consumers that already import React compose `React.ComponentType<Props>` at their own call site.

```ts
// ✓ contract — plain props, no React
export interface UserAvatarProps { userId: string; size?: 'sm' | 'md' | 'lg'; }
export const USER_AVATAR = Symbol.for('@gaev/user/USER_AVATAR');

// ✓ consumer (app page or impl) — React type added here, already imports React
import type { ComponentType } from 'react';
import { USER_AVATAR, type UserAvatarProps } from '@gaev/user-contract';
const UserAvatar = await resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR);
```

### Top-level `await` in page modules — clean cross-feature injection

Pages are imported via `React.lazy(() => import('./pages/DashboardPage'))` in `App.tsx`. When a module with top-level `await` is dynamically imported, the Promise returned by `import()` resolves only after all top-level awaits complete. `React.lazy` waits on that Promise and shows the `<Suspense>` fallback during loading.

This means: by the time a page component function is ever called by React, all resolved values are already available as module-level constants — including hook functions, which can then be called unconditionally at the top of the component. **No inner component, no `useState` for resolved values.**

**Use `Promise.all` for parallel bundle loading:**
```ts
// DashboardPage.tsx — runs before the component is ever rendered
const [useCurrentUser, DashboardWidget] = await Promise.all([
  resolveAsync<UseCurrentUser>(USE_CURRENT_USER),
  resolveAsync<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET),
]);

export default function DashboardPage() {
  const { user } = useCurrentUser(); // hook from User feature — called unconditionally ✓
  return (
    <div>
      <p>Logged in as: {user?.name ?? '…'}</p>
      <DashboardWidget />
    </div>
  );
}
```

This is the cross-feature hook injection demo: `UseCurrentUser` is a hook type defined in `@gaev/user-contract`, registered by `@gaev/user-impl`, and resolved + called by `DashboardPage` in `@gaev/app`.

### HashRouter for F5 persistence
`HashRouter` appends routes as URL hash (`/#/user`, `/#/dashboard`). Hard-refresh always loads `index.html`; the hash is client-only and restores the correct page. No server config needed.

---

## Code Patterns

### `container/src/index.ts`
```ts
import 'reflect-metadata';
import { Container } from 'inversify';

const container = new Container({ defaultScope: 'Singleton' });

type BundleLoader = () => Promise<unknown>;
interface BundleEntry {
  symbols: symbol[];
  loader: BundleLoader;
  loaded: boolean;
  loading: Promise<void> | null;
}
const bundles: BundleEntry[] = [];

export function registerBundle(symbols: symbol[], loader: BundleLoader): void {
  bundles.push({ symbols, loader, loaded: false, loading: null });
}

export async function resolveAsync<T>(symbol: symbol): Promise<T> {
  const entry = bundles.find((b) => b.symbols.includes(symbol));
  if (entry && !entry.loaded) {
    if (!entry.loading) {
      entry.loading = entry.loader().then(() => { entry.loaded = true; entry.loading = null; });
    }
    await entry.loading;
  }
  return container.get<T>(symbol);
}

export { container };
export { injectable, inject } from 'inversify';
```

Note: `useLazyFeature` is removed — top-level `await` in page modules replaces it entirely, making container's React dependency unnecessary.

---

### Contract package file structure (User as template — zero React)

```ts
// features/user-contract/src/IUser.ts
export interface IUser { id: string; name: string; avatarUrl: string; }
```

```ts
// features/user-contract/src/IUserService.ts
import type { IUser } from './IUser';
export abstract class IUserService { abstract getCurrentUser(): Promise<IUser>; }
export const USER_SERVICE = Symbol.for('@gaev/user/USER_SERVICE');
```

```ts
// features/user-contract/src/UserAvatarProps.ts
export interface UserAvatarProps { userId: string; size?: 'sm' | 'md' | 'lg'; }
export const USER_AVATAR = Symbol.for('@gaev/user/USER_AVATAR');
```

```ts
// features/user-contract/src/UseCurrentUser.ts
import type { IUser } from './IUser';
export type UseCurrentUser = () => { user: IUser | null; loading: boolean };
export const USE_CURRENT_USER = Symbol.for('@gaev/user/USE_CURRENT_USER');
```

```ts
// features/user-contract/src/symbols.ts
import { USER_SERVICE } from './IUserService';
import { USER_AVATAR } from './UserAvatarProps';
import { USE_CURRENT_USER } from './UseCurrentUser';

export const USER_SYMBOLS: symbol[] = [USER_SERVICE, USER_AVATAR, USE_CURRENT_USER];
```

```ts
// features/user-contract/src/index.ts
export * from './IUser';
export * from './IUserService';
export * from './UserAvatarProps';
export * from './UseCurrentUser';
export * from './symbols';
```

Follow the identical structure for `currency-contract` (`CURRENCY_SYMBOLS`) and `dashboard-contract` (`DASHBOARD_SYMBOLS`).

`IConversionResult` (referenced in `DashboardWidget.tsx`) is defined in `currency-contract`:
```ts
// features/currency-contract/src/IConversionResult.ts
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface IConversionResult {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;   // ← used as conversion.result.toFixed(2)
  rate: number;
}
```

`ICurrencyService.ts` imports `IConversionResult` and `CurrencyCode` from `./IConversionResult`.

---

### Impl `register.ts` + `index.ts`

```ts
// features/user-impl/src/register.ts
import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  USER_SERVICE, USER_AVATAR, USE_CURRENT_USER,
  type IUserService, type UserAvatarProps, type UseCurrentUser,
} from '@gaev/user-contract';
import { UserService } from './UserService';
import UserAvatar from './UserAvatar';
import useCurrentUser from './useCurrentUser';

container.bind<IUserService>(USER_SERVICE).toDynamicValue(() => new UserService());
container.bind<ComponentType<UserAvatarProps>>(USER_AVATAR).toConstantValue(UserAvatar);
container.bind<UseCurrentUser>(USE_CURRENT_USER).toConstantValue(useCurrentUser);
```

```ts
// features/user-impl/src/index.ts
import './register';
```

`dashboard-impl/src/register.ts` imports `DashboardWidget` (which has top-level `await`), making the entire dashboard-impl bundle async. This is the mechanism that causes `entry.loading` in the container to wait for user-impl and currency-impl before resolving:

```ts
// features/dashboard-impl/src/register.ts
import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  DASHBOARD_SERVICE, DASHBOARD_WIDGET, USE_DASHBOARD,
  type IDashboardService, type DashboardWidgetProps, type UseDashboard,
} from '@gaev/dashboard-contract';
import { DashboardService } from './DashboardService';
import { DashboardWidget } from './DashboardWidget'; // ← has top-level await; makes this bundle async
import useDashboard from './useDashboard';

container.bind<IDashboardService>(DASHBOARD_SERVICE).toDynamicValue(() => new DashboardService());
container.bind<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET).toConstantValue(DashboardWidget);
container.bind<UseDashboard>(USE_DASHBOARD).toConstantValue(useDashboard);
```

---

### App pages — top-level `await` pattern

**`UserPage.tsx`** — resolves service + component before the component runs:
```tsx
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import { USER_AVATAR, USER_SERVICE, type UserAvatarProps, type IUserService, type IUser } from '@gaev/user-contract';

const [UserAvatar, userService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),
  resolveAsync<IUserService>(USER_SERVICE),
]);

export default function UserPage() {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    userService.getCurrentUser().then(u => { if (!cancelled) setUser(u); });
    return () => { cancelled = true; };
  }, []);

  if (!user) return <p>Loading user…</p>;
  return (
    <div>
      <UserAvatar userId={user.id} size="lg" />
      <h1>{user.name}</h1>
    </div>
  );
}
```

**`DashboardPage.tsx`** — cross-feature hook injection:
```tsx
import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import { USE_CURRENT_USER, type UseCurrentUser } from '@gaev/user-contract';
import { DASHBOARD_WIDGET, type DashboardWidgetProps } from '@gaev/dashboard-contract';

const [useCurrentUser, DashboardWidget] = await Promise.all([
  resolveAsync<UseCurrentUser>(USE_CURRENT_USER),
  resolveAsync<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET),
]);

export default function DashboardPage() {
  const { user } = useCurrentUser(); // hook from @gaev/user-contract — unconditional ✓
  return (
    <div>
      <p>Logged in as: {user?.name ?? '…'}</p>
      <DashboardWidget />
    </div>
  );
}
```

`CurrencyPage.tsx` follows the same pattern as `UserPage`.

---

### `dashboard-impl/src/DashboardWidget.tsx` — cross-feature component + service injection

`DashboardWidget` uses the same top-level `await` pattern. These awaits run during dashboard-impl bundle initialization — the bundle's loader Promise (`entry.loading` in the container) waits for the full transitive module graph to settle, so `entry.loaded = true` only fires after all top-level awaits across the bundle complete. user-impl and currency-impl are loaded in parallel at that time, all behind the same `<Suspense>` fallback. By the time the component first renders, `UserAvatar`, `userService`, and `currencyService` are already resolved module-level constants — no `useState` for injected values, no intermediate loading state.

```tsx
import React, { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import { USER_AVATAR, USER_SERVICE, type UserAvatarProps, type IUserService, type IUser } from '@gaev/user-contract';
import { CURRENCY_SERVICE, type ICurrencyService, type IConversionResult } from '@gaev/currency-contract';
import type { DashboardWidgetProps } from '@gaev/dashboard-contract';

// Top-level await — runs when dashboard-impl bundle loads.
// user-impl and currency-impl load in parallel here.
const [UserAvatar, userService, currencyService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),  // component from User feature
  resolveAsync<IUserService>(USER_SERVICE),                   // service from User feature
  resolveAsync<ICurrencyService>(CURRENCY_SERVICE),           // service from Currency feature
]);

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ defaultAmount = 100 }) => {
  const [user, setUser]             = useState<IUser | null>(null);
  const [conversion, setConversion] = useState<IConversionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.getCurrentUser(),
      currencyService.convert(defaultAmount, 'USD', 'EUR'),
    ]).then(([u, conv]) => {
      if (!cancelled) { setUser(u); setConversion(conv); }
    });
    return () => { cancelled = true; };
  }, [defaultAmount]);

  if (!user || !conversion) return <p>Loading data…</p>;

  return (
    <div>
      <UserAvatar userId={user.id} size="md" />
      <h2>Welcome, {user.name}</h2>
      <p>{defaultAmount} USD = {conversion.result.toFixed(2)} EUR</p>
    </div>
  );
};
```

---

### `app/src/App.tsx` — `React.lazy` + `HashRouter`

```tsx
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';

// React.lazy enables top-level await in page modules to work correctly
const UserPage      = React.lazy(() => import('./pages/UserPage'));
const CurrencyPage  = React.lazy(() => import('./pages/CurrencyPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

export default function App() {
  return (
    <HashRouter>
      <nav>
        <Link to="/user">User</Link> |
        <Link to="/currency">Currency</Link> |
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Suspense fallback={<p>Loading…</p>}>
        <Routes>
          <Route path="/user"      element={<UserPage />} />
          <Route path="/currency"  element={<CurrencyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*"          element={<p>Select a page above</p>} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
```

---

### `app/src/bootstrap.ts`
```ts
import { registerBundle } from '@gaev/container';
import { USER_SYMBOLS } from '@gaev/user-contract';
import { CURRENCY_SYMBOLS } from '@gaev/currency-contract';
import { DASHBOARD_SYMBOLS } from '@gaev/dashboard-contract';

export function bootstrap(): void {
  registerBundle(USER_SYMBOLS,     () => import('@gaev/user-impl'));
  registerBundle(CURRENCY_SYMBOLS, () => import('@gaev/currency-impl'));
  registerBundle(DASHBOARD_SYMBOLS, () => import('@gaev/dashboard-impl'));
}
```

Adding a new symbol to a feature only requires updating the feature's own `symbols.ts` — `bootstrap.ts` stays unchanged.

### `app/src/main.tsx`
```tsx
import 'reflect-metadata'; // must be the very first import
import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrap } from './bootstrap';
import App from './App';

bootstrap();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

---

### `app/vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const r = (rel: string) => path.resolve(__dirname, rel);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@gaev/container':          r('../container/src/index.ts'),
      '@gaev/user-contract':      r('../features/user-contract/src/index.ts'),
      '@gaev/currency-contract':  r('../features/currency-contract/src/index.ts'),
      '@gaev/dashboard-contract': r('../features/dashboard-contract/src/index.ts'),
      '@gaev/user-impl':          r('../features/user-impl/src/index.ts'),
      '@gaev/currency-impl':      r('../features/currency-impl/src/index.ts'),
      '@gaev/dashboard-impl':     r('../features/dashboard-impl/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('-contract')) return 'contracts'; // all *-contract packages → single chunk
          if (id.includes('/container/src')) return 'container';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'vendor-react';
          // impl chunks split automatically by dynamic import() boundaries
        },
      },
    },
  },
});
```

---

## Package Configs

### `react/package.json`
```json
{
  "name": "gaev-modular-arch-react",
  "private": true,
  "workspaces": ["container", "features/*", "app"],
  "scripts": {
    "dev": "npm run dev --workspace=app",
    "build": "npm run build --workspace=app",
    "typecheck": "tsc --build --verbose"
  }
}
```

### Per-package deps summary
| Package | `dependencies` | `devDependencies` |
|---|---|---|
| `@gaev/container` | `inversify`, `reflect-metadata` | `typescript` |
| contract packages | *(none)* | `typescript` |
| impl packages | `@gaev/container`, own contract, `react` | `@types/react`, `typescript` |
| `dashboard-impl` | + `@gaev/user-contract`, `@gaev/currency-contract` | same |
| `@gaev/app` | `@gaev/container`, all 3 contracts, `react`, `react-dom`, `react-router-dom`, `reflect-metadata` | `vite`, `@vitejs/plugin-react`, `typescript` |

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

`target: "ES2022"` is required for top-level `await` support (ES2022 includes it).

Per-package tsconfig: extends the base, adds `composite: true`, `outDir`, `rootDir`, `include`. Features extend `../../tsconfig.base.json`; container and app extend `../tsconfig.base.json`.

---

## README Sections

1. Overview + motivation
2. Package types: app / contract / implementation / container (with rules for each)
3. Dependency graph diagram
4. **Dependency Inversion Principle** — high-level modules depend on abstractions (contracts), never concretions. Implementations are loaded at runtime, never imported statically. DIP applied at the module-bundle level.
5. `@gaev/container` — `registerBundle` / `resolveAsync`
6. What contracts can expose — interfaces, abstract classes, props interfaces, hook types, IoC symbols. No React import.
7. Cross-feature injection patterns:
   - Top-level `await` in page modules — how it works with `React.lazy` + `Suspense`
   - Top-level `await` in impl modules (`DashboardWidget`) — same pattern, loading at bundle init time
   - Hook injection in `DashboardPage` (top-level await, no inner component)
8. Bundle strategy — contracts chunk, per-feature impl chunks, DevTools Network walkthrough
9. How to add a new feature (step-by-step)
10. Getting started (install / dev / build)

---

## Implementation Order

1. `react/package.json` + `tsconfig.base.json`
2. `container/` package
3. All 3 contract packages (no React dep — fastest to create)
4. `npm install` from `react/` to create workspace symlinks
5. `user-impl/`, `currency-impl/` (independent features)
6. `dashboard-impl/` (depends on user + currency contracts)
7. `app/` — vite.config, index.html, main.tsx, bootstrap.ts, App.tsx, pages
8. `README.md`

---

## Verification

1. `npm install` — no peer-dep errors; `node_modules/@gaev/` contains workspace symlinks
2. `npm run dev` — all 3 pages navigate without errors
3. DevTools Network: each page load triggers only its own impl chunk(s); `<Suspense>` fallback visible while bundles load
4. Hard-refresh (`F5`) on `/#/dashboard` — stays on Dashboard; loads dashboard + user + currency impl chunks
5. `npm run build` — output chunks: `contracts.[h].js`, `container.[h].js`, `vendor-react.[h].js`, + 3 impl chunks + 3 page chunks
6. `grep -l "UserService\|CurrencyService" dist/contracts.*.js` — must return nothing
