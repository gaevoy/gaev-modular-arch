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
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('-contract')) return 'contracts';
          if (id.includes('/container/src')) return 'container';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'vendor-react';
        },
      },
    },
  },
});
