// reflect-metadata polyfills Reflect.getMetadata/hasMetadata onto the global Reflect object.
// inversify calls these unconditionally (even without @injectable decorators),
// so this must be imported before any inversify code runs.
import 'reflect-metadata';
import { Container } from 'inversify';

const container = new Container({ defaultScope: 'Singleton' });

type BundleLoader = () => Promise<unknown>;
interface BundleEntry {
  loader: BundleLoader;
  loading?: Promise<unknown>;
}
const bundles = new Map<symbol, BundleEntry>();

/**
 * Registers a lazy bundle. Call once per feature before any `resolveAsync` call.
 *
 * @param symbols - All IoC symbols exported by the feature's contract package (e.g. `USER_SYMBOLS`).
 * @param loader  - Dynamic import that registers bindings as a side-effect (e.g. `() => import('@gaev/user-impl')`).
 */
export function registerBundle(symbols: symbol[], loader: BundleLoader): void {
  const bundle = { loader };
  symbols.forEach((s) => bundles.set(s, bundle));
}

/**
 * Ensures the bundle that owns `symbol` is loaded, then resolves its container binding.
 * Concurrent calls for the same bundle share one in-flight `Promise` — the chunk is fetched only once.
 * Once loaded, the stored `Promise` acts as the loaded marker so subsequent calls skip the fetch.
 * Use `Promise.all` to load symbols from different bundles in parallel.
 *
 * @param symbol - IoC symbol from a `*-contract` package (e.g. `USER_SERVICE`).
 * @returns The bound value cast to `T`.
 */
export async function resolveAsync<T>(symbol: symbol): Promise<T> {
  const bundle = bundles.get(symbol);
  if (bundle) {
    bundle.loading ??= bundle.loader();
    await bundle.loading;
  }
  return container.get<T>(symbol);
}

export { container };
export { injectable, inject } from 'inversify';
