# Page Error Handling

## Problem

If a lazy-loaded page fails (e.g. bundle load error, unregistered symbol), the whole app crashes.

## Solution

Wrap `resolveAsync` in a `try/catch` inside the `React.lazy` factory. On failure, return a fallback error component instead of throwing.

## Changes

**`app/src/App.tsx`**

1. `createLazyPage` accepts a second argument `ErrorComponent: ComponentType<{ error: unknown }>`.
2. Inside the `async` factory, `resolveAsync` is wrapped in `try/catch`.
3. On catch, returns `{ default: () => <ErrorComponent error={e} /> }` — a valid lazy module with the error UI.
4. A default `PageError` component is defined and passed to all three pages.

```tsx
const createLazyPage = (symbol: symbol, ErrorComponent: ComponentType<{ error: unknown }>) =>
  React.lazy(async () => {
    try {
      return { default: await resolveAsync<ComponentType>(symbol) };
    } catch (e) {
      return { default: () => <ErrorComponent error={e} /> };
    }
  });

const PageError = ({ error }: { error: unknown }) => (
  <p style={{ color: 'red' }}>Page failed to load: {String(error)}</p>
);

const CurrencyPage = createLazyPage(CURRENCY_PAGE, PageError);
```

## How to test

In `app/src/bootstrap.ts`, replace one bundle registration with a rejecting promise:

```ts
registerBundle(CURRENCY_SYMBOLS, () => Promise.reject(new Error('bundle failed to load')));
```

Navigate to `/currency` — the error component renders instead of crashing the app.

## Trade-offs

- Only covers **load-time** failures (`resolveAsync` throwing). Render-time errors still need an Error Boundary.
- The lazy module is cached by React after first load, so the error component is permanently shown until the page refreshes.

## Alternative solutions

### 1. React Error Boundary (class component)

Wrap each route element in an `ErrorBoundary` component. Catches both load-time and render-time errors. More boilerplate but broader coverage.

```tsx
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <PageError error={this.state.error} />;
    return this.props.children;
  }
}

// usage
<PageErrorBoundary><CurrencyPage /></PageErrorBoundary>
```

### 2. `react-error-boundary` package

Drop-in Error Boundary with extras: `onError` callback, `resetKeys` for auto-recovery, `useErrorBoundary()` hook for triggering from async code. Recommended for production.

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallbackRender={({ error }) => <PageError error={error} />}>
  <CurrencyPage />
</ErrorBoundary>
```

### 3. Router-level error handling (React Router v6.4+)

Define an `errorElement` on the route. React Router catches loader/action errors and renders it automatically. Only works when using the data router API (`createBrowserRouter`), not `<Routes>`.

```tsx
const router = createBrowserRouter([
  { path: '/currency', element: <CurrencyPage />, errorElement: <PageError error={...} /> },
]);
```
