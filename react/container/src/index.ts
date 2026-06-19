// reflect-metadata polyfills Reflect.getMetadata/hasMetadata onto the global Reflect object.
// inversify calls these unconditionally (even without @injectable decorators),
// so this must be imported before any inversify code runs.
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

/**
 * Declares that `symbols` belong to a lazy chunk loaded by `loader`.
 * Call once per feature in `bootstrap.ts` before any `resolveAsync` call.
 *
 * @param symbols - All IoC symbols exported by the feature's contract package (e.g. `USER_SYMBOLS`).
 * @param loader  - Dynamic import factory that loads the impl package (e.g. `() => import('@gaev/user-impl')`).
 */
export function registerBundle(symbols: symbol[], loader: BundleLoader): void {
  bundles.push({ symbols, loader, loaded: false, loading: null });
}

/**
 * Loads the bundle that owns `symbol` (if not yet loaded), then returns its container binding.
 * Concurrent calls for the same bundle share one in-flight `Promise` — the chunk is fetched only once.
 * Use `Promise.all` to load multiple symbols from different bundles in parallel.
 *
 * @param symbol - IoC symbol from a `*-contract` package (e.g. `USER_SERVICE`).
 * @returns The bound value cast to `T`.
 */
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
