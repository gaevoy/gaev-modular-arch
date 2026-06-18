# Issues Spotted During Implementation

---

## 1. `vite.config.ts` missing `build.target: 'es2022'`

**Symptom:** Production build fails with:
```
Top-level await is not available in the configured target environment
("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides)
```

**Root cause:** The plan's `vite.config.ts` snippet omits a `build.target` field. Vite's esbuild transform uses its own target (`es2020` by default) independently of `tsconfig.base.json`'s `"target": "ES2022"`. TypeScript's `target` only affects type-checking and IDE feedback; the actual code transform at build time is done by esbuild, which needs its own instruction.

**Fix applied:** Added `target: 'es2022'` to the `build` block in `app/vite.config.ts`:
```ts
build: {
  target: 'es2022',   // ← added; required for top-level await
  rollupOptions: { ... },
},
```

**Plan fix:** The `vite.config.ts` snippet in the Code Patterns section should include this field.

---

## 2. `reflect-metadata` imported in both `container/src/index.ts` and `main.tsx`

**Symptom:** Not a runtime error — both imports are idempotent. But the plan contradicts itself.

**Root cause:** The Key Decisions section states:
> "Import once as the very first line of `main.tsx`."

However, the Code Patterns snippet for `container/src/index.ts` also starts with `import 'reflect-metadata'`. A reader following the Key Decisions rule would put it only in `main.tsx`; a reader following the code snippet would put it in both.

**Current state:** Both files import it, which works. The container's import is defensive (ensures the polyfill is present even if something imports `@gaev/container` before `main.tsx` runs), so there is a practical argument for keeping it there.

**Plan fix:** Either remove `import 'reflect-metadata'` from the `container/src/index.ts` snippet and update the Key Decisions rationale, or update Key Decisions to say "imported in `container/src/index.ts`; no need to repeat in `main.tsx`" — and remove it from the `main.tsx` snippet.

---

## 3. Vite injects `<link rel="modulepreload">` for impl chunks in `index.html`

**Symptom:** On the root page (no feature visited), `user-impl` loaded immediately. Initiator in DevTools: `(index):10` — meaning the preload came from a tag Vite injected directly into `index.html`.

**Root cause:** Vite statically analyzes dynamic import strings in the source. Because `bootstrap.ts` contains `() => import('@gaev/user-impl')` as a literal string, Vite resolved the chunk and added a `<link rel="modulepreload">` for it. The browser fetches all modulepreload targets eagerly on page load — defeating lazy loading for impl chunks.

**Fix applied:** Added `build.modulePreload.resolveDependencies` to `vite.config.ts` to strip impl chunks from the preload list:
```ts
modulePreload: {
  resolveDependencies: (_url, deps) => deps.filter(dep => !dep.includes('-impl-')),
},
```

**Why this is correct:** `vendor`, `container`, and `contracts` are always needed and benefit from being preloaded. Impl chunks are intentionally lazy — they should only load when `resolveAsync` is called for a symbol they own.

---

## 4. Removing `container` from `manualChunks` causes `user-impl` to load at startup

**Symptom:** After removing the `container` rule from `manualChunks` (to fold it into the app bundle), `user-impl` still loaded on the root page. Initiator changed from `(index):10` (preload tag — issue #3) to `app-[hash].js:2` — meaning the app bundle itself was dynamically importing `user-impl`.

**Root cause:** When `container` has no explicit `manualChunks` rule, Rollup's chunk splitting algorithm places the shared module (`@gaev/container` + inversify + reflect-metadata, ~52 kB) into the first dynamic chunk that wins in the split — in practice `user-impl`. The `app` entry chunk then has a cross-chunk import into `user-impl` to access `registerBundle`, which is needed at startup. This forces `user-impl` to load before the app can call `bootstrap()`.

Confirmed by checking which built chunk contained the `Container` symbol:
```
app-*.js:       0 matches
user-impl-*.js: 3 matches   ← inversify landed here
```

**Fix applied:** Restored an explicit `container` rule in `manualChunks`, pinning `@gaev/container`, inversify, and reflect-metadata together into a named `container` chunk that is always in the initial load:
```ts
if (id.includes('/container/src') || id.includes('node_modules/inversify') || id.includes('node_modules/reflect-metadata'))
  return 'container';
```

**Why `container` must be a separate named chunk:** It is a shared static dependency of every impl package. Without a rule, Rollup picks an arbitrary dynamic chunk to host it. Naming it explicitly keeps it in the initial load group (preloaded alongside `vendor` and `contracts`) and keeps all impl chunks lightweight — `user-impl` dropped from ~53 kB back to ~0.8 kB once inversify was moved out.
