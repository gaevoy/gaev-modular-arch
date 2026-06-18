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
