# Plan: ESLint Architectural Constraint Linter

## Context

The project documents strict layering rules (contract/impl/app) but has zero automated enforcement. This plan adds an ESLint flat config using only built-in ESLint rules — no extra plugins needed. `no-restricted-imports` and `no-restricted-syntax` cover all eleven constraints cleanly.

`eslint-plugin-boundaries` was considered but dropped: it only covers 2 of the 11 rules, while the remaining 9 always require built-in rules anyway. The full solution without it is simpler and has one fewer dependency.

---

## Rule IDs

Format: `ARCH_<SCOPE>_<N>` — screaming snake case, ≤ 10 chars, reads like a TypeScript constant.

| ID | Scope | Constraint |
|---|---|---|
| `ARCH_CTR_1` | container | No `@gaev/*` feature imports |
| `ARCH_CTR_2` | container | No React imports |
| `ARCH_CON_1` | contract | No `@gaev/*` imports |
| `ARCH_CON_2` | contract | No React imports |
| `ARCH_CON_3` | contract | No class declarations or expressions |
| `ARCH_CON_4` | contract | No function declarations |
| `ARCH_IMP_1` | impl files | No cross-impl imports |
| `ARCH_IMP_2` | impl index.ts | No exports |
| `ARCH_IMP_3` | impl register.ts | No exports |
| `ARCH_APP_1` | app | No static impl imports |
| `ARCH_APP_2` | app | No dynamic impl imports outside `bootstrap.ts` |

---

## What to implement

### 1. Root `package.json` — devDependencies + script

```json
"type": "module",
"scripts": {
  "lint": "eslint ."
},
"devDependencies": {
  "eslint": "^9.0.0",
  "typescript-eslint": "^8.0.0"
}
```

`"type": "module"` is required because `eslint.config.js` uses ES module syntax (`import`). Without it, Node emits a performance warning and reparses the file.

---

### 2. Create `.vscode/settings.json`

```json
{
  // Without this, the ESLint extension CWDs from the workspace root and uses LegacyConfigLoader,
  // which cannot find react/eslint.config.js and errors on every file. changeProcessCWD: true
  // makes the extension chdir into react/ so ESLint picks up the flat config correctly.
  "eslint.workingDirectories": [
    { "directory": "react", "changeProcessCWD": true }
  ]
}
```

---

### 3. Create `react/eslint.config.js`

Named constants at the top for all globs and regex patterns; seven rule blocks below.

```js
import tseslint from 'typescript-eslint';

const CONTAINER_FILES = 'container/src/**/*.ts';
const CONTRACT_FILES  = 'features/*-contract/src/**/*.ts';
const IMPL_FILES      = 'features/*-impl/src/**/*.{ts,tsx}';
const IMPL_INDEX      = 'features/*-impl/src/index.ts';
const IMPL_REGISTER   = 'features/*-impl/src/register.ts';
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
```

---

## Double-check notes

- **`regex` in `no-restricted-imports` patterns**: available since ESLint v8.22, present in v9. Preferred over `group` (micromatch glob) here because `*` in micromatch does not cross `/`, which would silently fail to match `@gaev/user-impl`.
- **`import type` coverage**: `no-restricted-imports` fires on all `ImportDeclaration` nodes. `import type { FC } from 'react'` is an `ImportDeclaration` with `importKind: 'type'` — it is caught.
- **Static vs dynamic import nodes**: `no-restricted-imports` only visits `ImportDeclaration` (static imports). Dynamic `import()` calls are `ImportExpression` nodes — covered separately by `no-restricted-syntax` with an esquery attribute selector.
- **Dynamic imports in bootstrap.ts**: The `ignores: [APP_BOOTSTRAP]` inside the last config object excludes `bootstrap.ts` from the `ImportExpression` ban. All other app files are still covered. Static impl imports remain banned in `bootstrap.ts` via the preceding block.
- **Relative imports unaffected**: `no-restricted-imports` compares the import specifier string against the regex. `./UserService` does not match `^@gaev/` or `^@gaev/[a-z-]+-impl$`.
- **Arrow function gap**: `ARCH_CON_4` catches `function foo() {}` but not `const fn = () => {}`. Current contract files contain no arrow functions — this is a known, acceptable limitation.
- **IMPL_INDEX and IMPL_REGISTER also match IMPL_FILES**: all three blocks apply to those files. Additive — no conflict.

---

## Verification

After `npm install` from `react/`:

```bash
npm run lint    # must pass clean on the current codebase
```

Confirm each rule fires by temporarily adding a violation:

| ID | File | Violation to add | Expected rule |
|---|---|---|---|
| `ARCH_CTR_1` | `container/src/index.ts` | `import '@gaev/user-contract'` | `no-restricted-imports` |
| `ARCH_CTR_2` | `container/src/index.ts` | `import 'react'` | `no-restricted-imports` |
| `ARCH_CON_1` | `features/*-contract/src/*.ts` | `import { X } from '@gaev/container'` | `no-restricted-imports` |
| `ARCH_CON_2` | `features/*-contract/src/*.ts` | `import { useState } from 'react'` | `no-restricted-imports` |
| `ARCH_CON_3` | `features/*-contract/src/*.ts` | `class Foo {}` | `no-restricted-syntax` |
| `ARCH_CON_4` | `features/*-contract/src/*.ts` | `function foo() {}` | `no-restricted-syntax` |
| `ARCH_IMP_1` | `features/*-impl/src/*.ts` | `import '@gaev/user-impl'` | `no-restricted-imports` |
| `ARCH_IMP_2` | `features/*-impl/src/index.ts` | `export const x = 1` | `no-restricted-syntax` |
| `ARCH_IMP_3` | `features/*-impl/src/register.ts` | `export const x = 1` | `no-restricted-syntax` |
| `ARCH_APP_1` | `app/src/App.tsx` | `import '@gaev/user-impl'` | `no-restricted-imports` |
| `ARCH_APP_2` | `app/src/App.tsx` | `import('@gaev/user-impl')` | `no-restricted-syntax` |
| *(exempt)* | `app/src/bootstrap.ts` | `import('@gaev/user-impl')` | must pass |
