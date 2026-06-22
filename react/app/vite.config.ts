import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const r = (rel: string) => path.resolve(__dirname, rel);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@gaev/container':          r('../container/src/index.ts'),
      '@gaev/user-contract':      r('../features/user/user-contract/src/index.ts'),
      '@gaev/currency-contract':  r('../features/currency/currency-contract/src/index.ts'),
      '@gaev/dashboard-contract': r('../features/dashboard/dashboard-contract/src/index.ts'),
      '@gaev/user-impl':          r('../features/user/user-impl/src/index.ts'),
      '@gaev/currency-impl':      r('../features/currency/currency-impl/src/index.ts'),
      '@gaev/dashboard-impl':     r('../features/dashboard/dashboard-impl/src/index.ts'),
    },
  },
  build: {
    target: 'es2022',
    modulePreload: {
      resolveDependencies: (_url, deps) => deps.filter(dep => !dep.includes('-impl-')),
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        manualChunks(id) {
          if (id.includes('-contract')) return 'contracts';
          if (id.includes('/container/src') || id.includes('node_modules/inversify') || id.includes('node_modules/reflect-metadata'))
            return 'container';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'vendor';
          const impl = id.match(/\/([\w-]+-impl)\//)?.[1];
          if (impl) return impl;
        },
      },
    },
  },
});
