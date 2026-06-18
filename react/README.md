# Modular Architecture Demo — React + npm Workspaces + Vite + inversify

Working demo of modular React architecture driven by the **Dependency Inversion Principle**. Features are isolated npm packages exposing typed contracts only; implementations are lazy-loaded Vite chunks registered with an IoC container at runtime.

---

## Overview

In a conventional React codebase the app imports feature code directly. As the codebase grows, this creates tight coupling: changing a service signature forces edits across every consumer, and bundles grow because nothing is ever truly optional. This project demonstrates an alternative where:

- The app **never imports implementation code statically** — only contracts (interfaces + symbols).
- Implementations are **dynamically imported** (separate Vite chunks) and registered into an IoC container on first use.
- Cross-feature dependencies are expressed through **contract symbols**, not concrete module paths.

The result is a codebase where adding, swapping, or removing a feature touches only that feature's own package plus one line in `bootstrap.ts`.

---

## Package Types

### `@gaev/container`
The IoC container. Wraps inversify's `Container` and adds two functions: `registerBundle` (called at startup to declare which symbols a lazy chunk owns) and `resolveAsync` (called at use-time to trigger loading and retrieve a binding). No React dependency.

**Rules:**
- No `@gaev/*` feature dependencies
- No React
- Exported API surface: `container`, `registerBundle`, `resolveAsync`, `injectable`, `inject`

### Contract packages (`*-contract`)
Pure TypeScript. Define what a feature _is_ — interfaces, abstract classes, props interfaces, hook types, and IoC symbols. Nothing else.

**Rules:**
- Zero `@gaev/*` dependencies
- Zero React imports of any kind (not even as a `devDependency` type import)
- No implementation logic

### Implementation packages (`*-impl`)
Concrete code. Import their own contract + `@gaev/container`, implement everything, and call `container.bind(...)` in `register.ts`. The package entry point (`index.ts`) is a single line: `import './register'`.

**Rules:**
- Must not be imported statically by `@gaev/app` — only via `() => import('@gaev/...-impl')` in `bootstrap.ts`
- May import other _contract_ packages for cross-feature types and symbols
- Must never import another _impl_ package

### `@gaev/app`
The React app. Imports contracts for types and symbols, never impl packages. Uses `React.lazy` + `Suspense` for page-level code splitting and top-level `await` in page modules for clean async injection.

**Rules:**
- Static imports: `@gaev/container`, all `*-contract` packages, React, react-router-dom
- Dynamic imports (in `bootstrap.ts` only): all `*-impl` packages

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
```

---

## Dependency Inversion Principle

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

Applied here at the **module-bundle level**:

- `@gaev/app` (high-level) depends on `@gaev/user-contract` (abstraction), not `@gaev/user-impl` (concretion).
- `@gaev/dashboard-impl` depends on `@gaev/user-contract` and `@gaev/currency-contract` — it calls user and currency services through their abstract interfaces, with no knowledge of `UserService` or `CurrencyService`.
- Implementations are loaded at runtime by the container. The app cannot accidentally introduce a compile-time dependency on an impl because the import is behind a function boundary in `bootstrap.ts`.

This means the app bundle contains zero implementation code at parse time. Each impl chunk is fetched only when a page that needs it is first visited.

---

## `@gaev/container`

Two functions drive the whole system:

```ts
// Declare at startup: "symbols X, Y, Z live in this lazy chunk"
registerBundle(USER_SYMBOLS, () => import('@gaev/user-impl'));

// Use at any time: load the chunk if needed, then return the binding
const userService = await resolveAsync<IUserService>(USER_SERVICE);
```

`resolveAsync` finds the bundle entry whose `symbols` array includes the requested symbol. If it hasn't loaded yet it calls the loader, caches the in-flight Promise (so concurrent calls share one fetch), and awaits it. Once loaded, it delegates to `container.get<T>(symbol)`.

inversify bindings use `toDynamicValue` / `toConstantValue` — no decorators, no reflect-metadata emit from user code. `reflect-metadata` is still imported once at the top of `main.tsx` because inversify's `Container` class reads `Reflect` at module load time.

---

## What Contracts Can Expose

| What | Example |
|---|---|
| Data interface | `interface IUser { id: string; name: string; avatarUrl: string; }` |
| Abstract service | `abstract class IUserService { abstract getCurrentUser(): Promise<IUser>; }` |
| Props interface | `interface UserAvatarProps { userId: string; size?: 'sm' \| 'md' \| 'lg'; }` |
| Hook type | `type UseCurrentUser = () => { user: IUser \| null; loading: boolean }` |
| IoC symbol | `const USER_SERVICE = Symbol.for('@gaev/user/USER_SERVICE')` |
| Symbols array | `const USER_SYMBOLS: symbol[] = [USER_SERVICE, USER_AVATAR, USE_CURRENT_USER]` |

Contracts must never import React. Props interfaces are plain TypeScript — consumers that already import React compose `React.ComponentType<Props>` at their own call site:

```ts
// contract — plain props, no React
export interface UserAvatarProps { userId: string; size?: 'sm' | 'md' | 'lg'; }
export const USER_AVATAR = Symbol.for('@gaev/user/USER_AVATAR');

// consumer — React type added here, already imports React
import type { ComponentType } from 'react';
import { USER_AVATAR, type UserAvatarProps } from '@gaev/user-contract';
const UserAvatar = await resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR);
```

---

## Cross-Feature Injection Patterns

### Top-level `await` in page modules

Pages are imported via `React.lazy(() => import('./pages/DashboardPage'))`. When a module with top-level `await` is dynamically imported, the Promise returned by `import()` resolves only after all top-level awaits complete. `React.lazy` waits on that Promise and shows the `<Suspense>` fallback during loading.

By the time a page component function is first called by React, all resolved values are already available as module-level constants. No inner component, no `useState` for injected values.

```ts
// UserPage.tsx — top-level await; runs before the component renders
const [UserAvatar, userService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),
  resolveAsync<IUserService>(USER_SERVICE),
]);

export default function UserPage() {
  // UserAvatar and userService are guaranteed to be ready here
}
```

Use `Promise.all` for parallel bundle loading whenever a page needs more than one symbol.

### Top-level `await` in impl modules (`DashboardWidget`)

The same pattern works inside impl packages. `DashboardWidget.tsx` has its own top-level awaits that load user-impl and currency-impl in parallel. Because `register.ts` imports `DashboardWidget`, the entire dashboard-impl bundle is async — its loader Promise (`entry.loading` in the container) won't resolve until `DashboardWidget`'s top-level awaits complete, which means user-impl and currency-impl are also loaded. All three impl chunks load in parallel behind a single `<Suspense>` fallback.

```ts
// DashboardWidget.tsx — runs at dashboard-impl bundle init time
const [UserAvatar, userService, currencyService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),
  resolveAsync<IUserService>(USER_SERVICE),
  resolveAsync<ICurrencyService>(CURRENCY_SERVICE),
]);
```

### Hook injection in `DashboardPage`

`DashboardPage` demonstrates cross-feature hook injection: `UseCurrentUser` is a hook type defined in `@gaev/user-contract`, bound by `@gaev/user-impl`, and resolved by `@gaev/app`. Because the hook is resolved via top-level `await` before the component renders, it can be called unconditionally at the top of the component — no Rules of Hooks violation, no conditional wrapper needed.

```tsx
// DashboardPage.tsx
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

---

## Bundle Strategy

Vite's `manualChunks` in `vite.config.ts` produces a predictable output:

| Chunk | Contents | Loaded |
|---|---|---|
| `vendor-react` | react, react-dom | initial |
| `container` | inversify + `@gaev/container` | initial |
| `contracts` | all three `*-contract` packages | initial |
| `index` | app bootstrap + router | initial |
| `UserPage` | page module | on `/user` visit |
| `CurrencyPage` | page module | on `/currency` visit |
| `DashboardPage` | page module | on `/dashboard` visit |
| user-impl | `UserService`, `UserAvatar`, `useCurrentUser` | on first user symbol resolve |
| currency-impl | `CurrencyService`, `CurrencyInput`, `useConversion` | on first currency symbol resolve |
| dashboard-impl | `DashboardWidget`, `DashboardService` + transitively user-impl + currency-impl | on `/dashboard` visit |

**DevTools Network walkthrough:** Open the Network tab, filter by JS, then navigate:

1. `/user` — triggers `UserPage` chunk, then user-impl chunk. `<Suspense>` fallback appears briefly.
2. `/currency` — triggers `CurrencyPage` + currency-impl chunks.
3. `/dashboard` — triggers `DashboardPage` + dashboard-impl + (if not cached) user-impl + currency-impl. All three impl chunks load in parallel.
4. Hard-refresh on `/#/dashboard` — `HashRouter` keeps the route client-side; all required chunks load on arrival.

---

## How to Add a New Feature

1. **Create `features/my-feature-contract/`** — add `package.json` (`name: @gaev/my-feature-contract`, no deps), `tsconfig.json` extending `../../tsconfig.base.json`, and `src/` with interfaces, an abstract class, props types, a hook type, symbols, and `index.ts` re-exporting everything. Add `MY_SYMBOLS: symbol[]` to `symbols.ts`.

2. **Create `features/my-feature-impl/`** — add `package.json` (deps: `@gaev/container`, `@gaev/my-feature-contract`, `react`), `tsconfig.json`, and `src/` with concrete implementations. Write `register.ts` that calls `container.bind(...)` for each symbol. Write `index.ts` with a single `import './register'`.

3. **Register the bundle in `app/src/bootstrap.ts`:**
   ```ts
   import { MY_SYMBOLS } from '@gaev/my-feature-contract';
   registerBundle(MY_SYMBOLS, () => import('@gaev/my-feature-impl'));
   ```

4. **Add a page in `app/src/pages/`** using top-level `await` to resolve what the page needs:
   ```ts
   const myComponent = await resolveAsync<ComponentType<MyProps>>(MY_COMPONENT);
   export default function MyPage() { return <myComponent />; }
   ```

5. **Add a route in `App.tsx`:**
   ```tsx
   const MyPage = React.lazy(() => import('./pages/MyPage'));
   // inside <Routes>:
   <Route path="/my-feature" element={<MyPage />} />
   ```

6. Run `npm install` from `react/` to create the new workspace symlink.

No other packages need to change.

---

## Getting Started

```bash
# from react/
npm install          # install all workspace deps + create @gaev/* symlinks
npm run dev          # start Vite dev server (default: http://localhost:5173)
npm run build        # production build → app/dist/
npm run typecheck    # tsc --build across all packages
```

Navigate to `/#/user`, `/#/currency`, or `/#/dashboard`. Each page loads its own impl chunk on first visit. Hard-refresh (`F5`) on any route works correctly via `HashRouter`.
