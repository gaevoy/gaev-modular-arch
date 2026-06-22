import tseslint from 'typescript-eslint';

const CONTAINER_FILES = 'container/src/**/*.ts';
const CONTRACT_FILES  = 'features/*/*-contract/src/**/*.ts';
const IMPL_FILES      = 'features/*/*-impl/src/**/*.{ts,tsx}';
const IMPL_INDEX      = 'features/*/*-impl/src/index.ts';
const IMPL_REGISTER   = 'features/*/*-impl/src/register.ts';
const APP_FILES       = 'app/src/**/*.{ts,tsx}';
const APP_BOOTSTRAP   = 'app/src/bootstrap.ts';

// `regex` instead of `group` because micromatch * doesn't cross / in scoped package names.
const GAEV_ANY_IMPORT  = '^@gaev/';
const GAEV_IMPL_IMPORT = '^@gaev/[a-z-]+-impl$';
const REACT_IMPORT     = '^react';

export default tseslint.config(

  { ignores: ['**/dist/**', '**/node_modules/**'] },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
  },

  // Container: shared IoC infrastructure — must not depend on any feature package or React.
  {
    files: [CONTAINER_FILES],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { regex: GAEV_ANY_IMPORT, message: '[ARCH_CTR_1] Container must not import @gaev/* feature packages.' },
          { regex: REACT_IMPORT,    message: '[ARCH_CTR_2] Container must not import React.' },
        ],
      }],
    },
  },

  // Contracts: pure type/symbol definitions — no runtime deps, no React, no classes/functions.
  {
    files: [CONTRACT_FILES],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { regex: GAEV_ANY_IMPORT, message: '[ARCH_CON_1] Contract packages must not import @gaev/* packages.' },
          // Covers `import type { FC } from 'react'` — no-restricted-imports fires on all ImportDeclaration nodes.
          { regex: REACT_IMPORT,    message: '[ARCH_CON_2] Contract packages must not import React. Use plain TypeScript types.' },
        ],
      }],
      'no-restricted-syntax': ['error',
        { selector: 'ClassDeclaration',    message: '[ARCH_CON_3] Move classes to the -impl package.' },
        { selector: 'ClassExpression',     message: '[ARCH_CON_3] Move classes to the -impl package.' },
        { selector: 'FunctionDeclaration', message: '[ARCH_CON_4] Move functions to the -impl package.' },
      ],
    },
  },

  // Impl files: must not import other impl packages — cross-feature deps go through the container.
  {
    files: [IMPL_FILES],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ regex: GAEV_IMPL_IMPORT, message: '[ARCH_IMP_1] Impl packages must not import other impl packages. Use the container for cross-feature dependencies.' }],
      }],
    },
  },

  // index.ts: side-effect entry point only — exporting would bypass the container.
  {
    files: [IMPL_INDEX],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: 'ExportNamedDeclaration',   message: "[ARCH_IMP_2] Impl index.ts must not export. The only allowed statement is `import './register'`." },
        { selector: 'ExportDefaultDeclaration', message: "[ARCH_IMP_2] Impl index.ts must not export. The only allowed statement is `import './register'`." },
        { selector: 'ExportAllDeclaration',     message: "[ARCH_IMP_2] Impl index.ts must not export. The only allowed statement is `import './register'`." },
      ],
    },
  },

  // register.ts: registers services into the container — exports would leak internals.
  {
    files: [IMPL_REGISTER],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: 'ExportNamedDeclaration',   message: '[ARCH_IMP_3] register.ts must not export anything. It is a side-effect-only module.' },
        { selector: 'ExportDefaultDeclaration', message: '[ARCH_IMP_3] register.ts must not export anything. It is a side-effect-only module.' },
        { selector: 'ExportAllDeclaration',     message: '[ARCH_IMP_3] register.ts must not export anything. It is a side-effect-only module.' },
      ],
    },
  },

  // App: impl packages must be loaded lazily via dynamic import() in bootstrap.ts, not statically.
  // Dynamic import() is an ImportExpression — no-restricted-imports only fires on ImportDeclaration.
  {
    files: [APP_FILES],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ regex: GAEV_IMPL_IMPORT, message: '[ARCH_APP_1] App must not statically import impl packages. Use dynamic import() in bootstrap.ts.' }],
      }],
    },
  },

  // Dynamic impl imports are only allowed in bootstrap.ts — that is the single wiring point.
  // Uses no-restricted-syntax because no-restricted-imports only covers static ImportDeclaration,
  // not ImportExpression (dynamic import()).
  {
    files: [APP_FILES],
    ignores: [APP_BOOTSTRAP],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: "ImportExpression[source.value=/^@gaev\\/[a-z-]+-impl/]", message: '[ARCH_APP_2] Dynamic impl imports belong in bootstrap.ts only.' },
      ],
    },
  },

);
